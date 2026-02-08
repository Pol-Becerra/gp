/**
 * Data Extraction Service - GuíaPymes
 * Extracción de datos de Google Maps con Puppeteer (v2 - Refactorizado)
 * 
 * Cambios principales:
 * - Navegación directa a cada URL en lugar de clicks (evita race conditions)
 * - Mejor espera para carga completa del panel
 * - Selectores mejorados y múltiples alternativas
 * - Validación de datos antes de retornar
 */

const puppeteer = require('puppeteer');

class GoogleMapsExtractor {
    constructor(options = {}) {
        this.headless = options.headless !== false;
        this.maxResults = options.maxResults ?? 100;
        this.delay = options.delay ?? 2000;
        this.debug = options.debug ?? false;
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: this.headless ? 'new' : false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await this.page.setViewport({ width: 1280, height: 900 });
    }

    async search(categoria, codigoPostal) {
        const query = `${categoria} en CP ${codigoPostal}, Argentina`;
        const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

        console.log(`[SCRAPER] Navegando a: ${url}...`);

        try {
            await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            await this.handleCookieConsent();
            await this.page.waitForSelector('div[role="feed"], .fontHeadlineSmall', { timeout: 30000 });
        } catch (e) {
            console.log('[SCRAPER] ⚠️ Timeout o error en carga inicial, intentando continuar...');
        }

        // Scroll para cargar todos los resultados
        await this.autoScroll();

        // Recopilar URLs de todos los resultados
        const resultLinks = await this.page.evaluate(() => {
            const links = document.querySelectorAll('a.hfpxzc');
            return Array.from(links).map(a => ({
                url: a.href,
                name: a.getAttribute('aria-label') || ''
            }));
        });

        console.log(`[SCRAPER] Se encontraron ${resultLinks.length} candidatos.`);

        const results = [];
        const limit = Math.min(resultLinks.length, this.maxResults);
        const processedUrls = new Set(); // Evitar duplicados

        for (let i = 0; i < limit; i++) {
            const item = resultLinks[i];

            // Saltar si ya procesamos esta URL
            if (processedUrls.has(item.url)) {
                console.log(`[SCRAPER] [${i + 1}/${limit}] Saltando duplicado: ${item.name}`);
                continue;
            }
            processedUrls.add(item.url);

            try {
                console.log(`[SCRAPER] [${i + 1}/${limit}] Procesando: ${item.name}...`);

                // NAVEGACIÓN DIRECTA a la URL del negocio (evita race conditions)
                await this.page.goto(item.url, { waitUntil: 'networkidle2', timeout: 30000 });

                // Esperar a que cargue el título del negocio
                await this.page.waitForSelector('h1.DUwDvf', { timeout: 10000 });

                // Espera adicional para asegurar que todos los datos se carguen
                await this.sleep(1500);

                const details = await this.extractBusinessDetails();

                // Validar que obtuvimos el negocio correcto
                const extractedName = details.nombre || item.name;

                // Extraer place_id de la URL
                const placeIdMatch = item.url.match(/!1s([^!]+)/);
                const placeId = placeIdMatch ? placeIdMatch[1] : null;

                const businessData = {
                    nombre: extractedName,
                    google_maps_url: item.url,
                    google_place_id: placeId,
                    rating: details.rating,
                    review_count: details.review_count,
                    telefono: details.telefono,
                    website: details.website,
                    direccion: details.direccion,
                    categoria: details.categoria,
                    raw_info: details.raw_info
                };

                // Solo agregar si tiene nombre válido
                if (businessData.nombre && businessData.nombre.length > 1) {
                    results.push(businessData);

                    if (this.debug) {
                        console.log(`    📞 Tel: ${businessData.telefono || 'N/A'}`);
                        console.log(`    🌐 Web: ${businessData.website || 'N/A'}`);
                        console.log(`    📍 Dir: ${businessData.direccion || 'N/A'}`);
                    }
                }

            } catch (err) {
                console.log(`[SCRAPER] ⚠️ Error en ${item.name}: ${err.message}`);
                if (this.debug) {
                    await this.page.screenshot({ path: `debug_${i}.png` });
                }
            }
        }

        if (results.length === 0) {
            console.log('[SCRAPER] ❌ 0 resultados extraídos con éxito.');
            await this.page.screenshot({ path: 'scraper_debug.png' });
        }

        console.log(`[SCRAPER] ✅ Proceso terminado. ${results.length} resultados finales.`);
        return results;
    }

    async extractBusinessDetails() {
        return await this.page.evaluate(() => {
            // Helper para extraer texto de un elemento
            const getText = (selectors) => {
                for (const sel of selectors) {
                    const el = document.querySelector(sel);
                    if (el) {
                        // Buscar texto en subelementos comunes
                        const textEl = el.querySelector('.Io6YTe, .fontBodyMedium') || el;
                        const text = textEl.textContent?.trim();
                        if (text && text.length > 0) return text;
                    }
                }
                return null;
            };

            // Nombre del negocio
            const nombre = document.querySelector('h1.DUwDvf')?.textContent?.trim() || '';

            // Rating y reviews
            let rating = null;
            let review_count = 0;

            const ratingEl = document.querySelector('span.ceNzKf span[aria-hidden="true"], span.MW4etd');
            if (ratingEl) {
                rating = parseFloat(ratingEl.textContent.replace(',', '.')) || null;
            }

            const reviewEl = document.querySelector('span.UY7F9[aria-label*="opiniones"], button[jsaction*="reviews"] span');
            if (reviewEl) {
                const match = reviewEl.textContent.match(/[\d.,]+/);
                if (match) {
                    review_count = parseInt(match[0].replace(/[.,]/g, '')) || 0;
                }
            }

            // Teléfono - múltiples selectores
            const telefono = getText([
                'button[data-item-id^="phone:tel:"] .Io6YTe',
                'button[data-item-id^="phone:tel:"]',
                'a[data-item-id^="phone:tel:"] .Io6YTe',
                'button[aria-label*="Teléfono"] .Io6YTe',
                '[data-tooltip*="teléfono"] .Io6YTe'
            ]);

            // Website - obtener href real
            let website = null;
            const webSelectors = [
                'a[data-item-id="authority"]',
                'a[aria-label*="Sitio web"]',
                'a[data-tooltip*="sitio web"]'
            ];
            for (const sel of webSelectors) {
                const webEl = document.querySelector(sel);
                if (webEl && webEl.href) {
                    // Verificar que no sea una URL de Google
                    if (!webEl.href.includes('google.com')) {
                        website = webEl.href;
                        break;
                    }
                }
            }

            // Dirección
            const direccion = getText([
                'button[data-item-id="address"] .Io6YTe',
                'button[data-item-id="address"]',
                '[data-tooltip*="dirección"] .Io6YTe'
            ]);

            // Categoría
            const catEl = document.querySelector('button[jsaction*="category"]');
            const categoria = catEl?.textContent?.trim() || '';

            // Raw info combinando dirección y categoría
            const rawParts = [direccion, categoria].filter(Boolean);
            const raw_info = rawParts.join(' | ') || '';

            return {
                nombre,
                rating,
                review_count,
                telefono,
                website,
                direccion,
                categoria,
                raw_info
            };
        });
    }

    async handleCookieConsent() {
        try {
            const cookieButton = await this.page.waitForSelector(
                'form[action*="consent.google.com"] button, button[aria-label*="Aceptar"], button[aria-label*="Accept"]',
                { timeout: 3000 }
            );
            if (cookieButton) {
                console.log('[SCRAPER] Click en consentimiento de cookies...');
                await cookieButton.click();
                await this.sleep(2000);
            }
        } catch (e) {
            // No apareció el botón, ignorar
        }
    }

    async autoScroll() {
        console.log('[SCRAPER] Scrolleando para cargar más resultados...');

        await this.page.evaluate(async (maxResults) => {
            const scrollableElement = document.querySelector('div[role="feed"]');
            if (!scrollableElement) return;

            await new Promise((resolve) => {
                let totalHeight = 0;
                let distance = 400;
                let lastCount = 0;
                let stableRounds = 0;

                const timer = setInterval(() => {
                    const scrollHeight = scrollableElement.scrollHeight;
                    scrollableElement.scrollBy(0, distance);
                    totalHeight += distance;

                    const resultsCount = document.querySelectorAll('a.hfpxzc').length;

                    // Detectar si ya no hay más resultados nuevos
                    if (resultsCount === lastCount) {
                        stableRounds++;
                    } else {
                        stableRounds = 0;
                        lastCount = resultsCount;
                    }

                    // Terminar si: alcanzamos máximo, llegamos al final, o no hay nuevos después de 5 intentos
                    if (resultsCount >= maxResults || totalHeight >= scrollHeight || stableRounds >= 5) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 600);
            });
        }, this.maxResults);

        await this.sleep(1000);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

module.exports = { GoogleMapsExtractor };
