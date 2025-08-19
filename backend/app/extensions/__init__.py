"""
Extension system for pluggable manga sources.

This package contains infrastructure for loading scraper implementations
at runtime. Each extension must reside in a subpackage and provide a
module-level `source` object that implements the `BaseScraper` interface
defined in `app.extensions.base`.
"""
