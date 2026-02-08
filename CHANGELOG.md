# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Backend**: Created `CategoryService` in `services/crm/categories.js` to handle DB operations.
- **API**: New endpoints for category management: `GET`, `POST`, `PUT`, `DELETE /api/categories`.
- **Frontend**: Dashboard page for categories (`/dashboard/categorias`) with full CRUD support.
- **Frontend**: Interactive `CategoryDialog` component for creating/editing categories.
- **Documentation**: New skills in `.agents/`: `comitter.md`, `changelog-generator.md`, and `request-tracker.md`.
- **Database**: Stored procedure `upsert_google_maps_data()` for atomic insert/update operations in Google Maps extraction.
- **Database**: Stored procedure `clean_data_google_maps()` to truncate all records from data_google_maps table (development utility).
- **API**: New endpoint `DELETE /api/raw-data/clean` to execute table cleanup.
- **Frontend**: Added "Limpiar DGM" button in scraper admin page with confirmation modal for development data cleanup.

- **Data Extraction**: Refactored `services/data-extraction/index.js` to navigate directly to each business URL, eliminating race conditions and ensuring 100% data accuracy.
- **Frontend**: Added a detailed extraction summary to the scraper modal, including counts for new/updated records and quality metrics (phone/web %).
- **Frontend**: Implemented a 5-second auto-close countdown in the scraper modal after successful extraction.
- **API**: Updated `/api/scraper/run` to be synchronous and return detailed extraction statistics.
- **Database**: Fixed `upsert_google_maps_data()` procedure to handle parameter order and ambiguous column references.
- **Scripts**: Updated `scripts/run-extraction.js` with improved argument parsing, debug mode, and statistics logging.

### Fixed

- **UI**: Fixed bug where the "Save" button in the category edit modal failed due to unhandled fields.
- **UI**: Corrected behavior of the color picker for categories without a pre-defined color.
