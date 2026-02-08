/**
 * Data Extraction Service - GuíaPymes
 * Extracción de datos de Google Maps con Puppeteer (Actualizado)
 */

const puppeteer = require('puppeteer');

class GoogleMapsExtractor {
    constructor(options = {}) {
        this.headless = options.headless !== false;
        this.maxResults = options.maxResults ?? 100;
        this.delay = options.delay ?? 3000;
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
                '--single-process',
                '--disable-gpu'
            ]
        });
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await this.page.setViewport({ width: 1280, height: 800 });
    }

    async search(categoria, codigoPostal) {
        const query = `${categoria} en CP ${codigoPostal}, Argentina`;
        const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

        console.log(`[SCRAPER] Navegando a: ${url}...`);

        try {
            await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // Manejar consentimiento de cookies si aparece
            try {
                const cookieButton = await this.page.waitForSelector('form[action*="consent.google.com"] button, button[aria-label*="Aceptar"], button[aria-label*="Agree"]', { timeout: 5000 });
                if (cookieButton) {
                    console.log('[SCRAPER] Click en consentimiento de cookies...');
                    await cookieButton.click();
                    await new Promise(r => setTimeout(r, 2000));
                }
            } catch (e) {
                // No apareció el botón, ignorar
            }

            // Esperar a que cargue la lista de resultados
            await this.page.waitForSelector('div[role="feed"], .fontHeadlineSmall', { timeout: 30000 });
        } catch (e) {
            console.log('[SCRAPER] ⚠️ Timeout o error en carga inicial, intentando continuar...');
        }

        await this.autoScroll();

        // Obtener los enlaces de los resultados primero
        const resultLinks = await this.page.evaluate(() => {
            const links = document.querySelectorAll('a.hfpxzc');
            return Array.from(links).map(a => ({
                url: a.href,
                name: a.getAttribute('aria-label') || ''
            }));
        });

        console.log(`[SCRAPER] Se encontraron ${resultLinks.length} candidatos. Extrayendo detalles uno por uno...`);

        const results = [];
        // Limitar para no tardar una eternidad en pruebas, pero procesar los encontrados
        const limit = Math.min(resultLinks.length, this.maxResults);

        for (let i = 0; i < limit; i++) {
            try {
                const item = resultLinks[i];
                console.log(`[SCRAPER] [${i + 1}/${limit}] Procesando: ${item.name}...`);

                // Click en el resultado para abrir el panel lateral
                const selector = `a.hfpxzc[href="${item.url}"]`;
                await this.page.click(selector);

                // Esperar a que el panel de detalles se cargue (la dirección es el mejor indicador)
                try {
                    await this.page.waitForSelector('button[data-item-id="address"]', { timeout: 5000 });
                } catch (e) {
                    console.log(`[SCRAPER] Panel no cargó completamente para: ${item.name}`);
                }

                const details = await this.extractSidebarDetails();
                results.push({
                    ...details,
                    nombre: item.name || details.nombre,
                    google_maps_url: item.url,
                    google_place_id: item.url.split('!1s')[1]?.split('!')[0] || null
                });
            } catch (err) {
                console.log(`[SCRAPER] Error extrayendo detalles de un registro:`, err.message);
            }
        }

        if (results.length === 0) {
            console.log('[SCRAPER] ❌ 0 resultados extraídos con éxito.');
            await this.page.screenshot({ path: 'scraper_debug.png' });
        }

        console.log(`[SCRAPER] Proceso terminado. ${results.length} resultados finales.`);
        return results;
    }

    async extractSidebarDetails() {
        return await this.page.evaluate(() => {
            const container = document.body;

            // Texto del campo basado en selectores estables decubiertos
            const getVal = (selector) => {
                const el = container.querySelector(selector);
                if (!el) return null;
                // El texto real suele estar en un div con clase Io6YTe
                const textEl = el.querySelector('.Io6YTe');
                return textEl ? textEl.textContent.trim() : el.textContent.trim();
            };

            // Rating
            const ratingEl = container.querySelector('span.ceNzR .MW4etd, span[aria-label*="estrellas"]');
            const rating = ratingEl ? ratingEl.textContent.trim().replace(',', '.') : null;

            // Teléfono (Selector exacto)
            const telefono = getVal('button[data-item-id^="phone:tel:"]');

            // Website (Selector exacto)
            const webEl = container.querySelector('a[data-item-id="authority"]');
            const website = webEl ? webEl.href : null;

            // Dirección
            const address = getVal('button[data-item-id="address"]') || '';

            // Categoría
            const catEl = container.querySelector('button[jsaction*="category"]');
            const category = catEl ? catEl.textContent.trim() : '';

            return {
                nombre: document.querySelector('h1.DUwDvf')?.textContent || '',
                rating: rating ? parseFloat(rating) : null,
                telefono: telefono,
                website: website,
                raw_info: `${address} | ${category}`,
                review_count: 0
            };
        });
    }

    async autoScroll() {
        await this.page.evaluate(async (maxResults) => {
            const scrollableElement = document.querySelector('div[role="feed"]');
            if (!scrollableElement) return;

            await new Promise((resolve) => {
                let totalHeight = 0;
                let distance = 300;
                let timer = setInterval(() => {
                    let scrollHeight = scrollableElement.scrollHeight;
                    scrollableElement.scrollBy(0, distance);
                    totalHeight += distance;

                    const resultsCount = document.querySelectorAll('a.hfpxzc').length;
                    if (totalHeight >= scrollHeight || resultsCount >= maxResults) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 800);
            });
        }, this.maxResults);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

module.exports = { GoogleMapsExtractor };
