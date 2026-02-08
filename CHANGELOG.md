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

### Changed

- **Data Extraction**: Refactored `scripts/run-extraction.js` to use the new stored procedure instead of inline SQL, improving maintainability and logging.

### Fixed

- **UI**: Fixed bug where the "Save" button in the category edit modal failed due to unhandled fields.
- **UI**: Corrected behavior of the color picker for categories without a pre-defined color.
