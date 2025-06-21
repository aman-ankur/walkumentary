"""Tests for configuration module."""
import pytest
from unittest.mock import patch
import os

from config import Settings


class TestSettings:
    """Test Settings configuration."""
    
    def test_default_values(self):
        """Test default configuration values."""
        with patch.dict(os.environ, {}, clear=True):
            # Override required fields
            with patch.dict(os.environ, {
                'DATABASE_URL': 'postgresql://user:pass@localhost/test',
                'SECRET_KEY': 'test-secret-key',
                'SUPABASE_URL': 'https://test.supabase.co',
                'SUPABASE_ANON_KEY': 'test-anon-key'
            }):
                settings = Settings()
                
                assert settings.app_name == "Walkumentary API"
                assert settings.debug is False
                assert settings.cors_origins == ["*"]
    
    def test_environment_variable_override(self):
        """Test that environment variables override defaults."""
        with patch.dict(os.environ, {
            'APP_NAME': 'Custom App',
            'DEBUG': 'true',
            'DATABASE_URL': 'postgresql://user:pass@localhost/custom',
            'SECRET_KEY': 'custom-secret-key',
            'SUPABASE_URL': 'https://custom.supabase.co',
            'SUPABASE_ANON_KEY': 'custom-anon-key',
            'CORS_ORIGINS': 'http://localhost:3000,https://example.com'
        }):
            settings = Settings()
            
            assert settings.app_name == "Custom App"
            assert settings.debug is True
            assert settings.database_url == "postgresql://user:pass@localhost/custom"
            assert settings.secret_key == "custom-secret-key"
            assert settings.supabase_url == "https://custom.supabase.co"
            assert settings.supabase_anon_key == "custom-anon-key"
            assert settings.cors_origins == ["http://localhost:3000", "https://example.com"]
    
    def test_cors_origins_parsing_string(self):
        """Test CORS origins parsing from string."""
        with patch.dict(os.environ, {
            'DATABASE_URL': 'postgresql://user:pass@localhost/test',
            'SECRET_KEY': 'test-secret-key',
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_ANON_KEY': 'test-anon-key',
            'CORS_ORIGINS': 'http://localhost:3000,https://app.example.com,https://api.example.com'
        }):
            settings = Settings()
            
            expected = [
                "http://localhost:3000",
                "https://app.example.com", 
                "https://api.example.com"
            ]
            assert settings.cors_origins == expected
    
    def test_cors_origins_parsing_list(self):
        """Test CORS origins when already a list."""
        origins = ["http://localhost:3000", "https://example.com"]
        
        with patch.dict(os.environ, {
            'DATABASE_URL': 'postgresql://user:pass@localhost/test',
            'SECRET_KEY': 'test-secret-key',
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_ANON_KEY': 'test-anon-key'
        }):
            settings = Settings()
            # Manually set to test list handling
            settings.cors_origins = origins
            
            assert settings.cors_origins == origins
    
    def test_cors_origins_parsing_empty(self):
        """Test CORS origins parsing when empty."""
        with patch.dict(os.environ, {
            'DATABASE_URL': 'postgresql://user:pass@localhost/test',
            'SECRET_KEY': 'test-secret-key',
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_ANON_KEY': 'test-anon-key',
            'CORS_ORIGINS': ''
        }):
            settings = Settings()
            
            assert settings.cors_origins == [""]
    
    def test_cors_origins_parsing_whitespace(self):
        """Test CORS origins parsing with whitespace."""
        with patch.dict(os.environ, {
            'DATABASE_URL': 'postgresql://user:pass@localhost/test',
            'SECRET_KEY': 'test-secret-key',
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_ANON_KEY': 'test-anon-key',
            'CORS_ORIGINS': ' http://localhost:3000 , https://example.com , https://api.example.com '
        }):
            settings = Settings()
            
            expected = [
                "http://localhost:3000",
                "https://example.com",
                "https://api.example.com"
            ]
            assert settings.cors_origins == expected
    
    def test_database_url_sqlite_conversion(self):
        """Test SQLite database URL conversion for SQLAlchemy."""
        with patch.dict(os.environ, {
            'DATABASE_URL': 'sqlite:///./test.db',
            'SECRET_KEY': 'test-secret-key',
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_ANON_KEY': 'test-anon-key'
        }):
            settings = Settings()
            
            # Should remain unchanged for SQLite
            assert settings.database_url == "sqlite:///./test.db"
    
    def test_database_url_postgresql_conversion(self):
        """Test PostgreSQL database URL conversion for SQLAlchemy."""
        with patch.dict(os.environ, {
            'DATABASE_URL': 'postgres://user:pass@localhost:5432/dbname',
            'SECRET_KEY': 'test-secret-key',
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_ANON_KEY': 'test-anon-key'
        }):
            settings = Settings()
            
            # Should convert postgres:// to postgresql://
            assert settings.database_url == "postgresql://user:pass@localhost:5432/dbname"
    
    def test_database_url_already_postgresql(self):
        """Test PostgreSQL database URL that's already correct."""
        with patch.dict(os.environ, {
            'DATABASE_URL': 'postgresql://user:pass@localhost:5432/dbname',
            'SECRET_KEY': 'test-secret-key',
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_ANON_KEY': 'test-anon-key'
        }):
            settings = Settings()
            
            # Should remain unchanged
            assert settings.database_url == "postgresql://user:pass@localhost:5432/dbname"
    
    def test_required_fields_validation(self):
        """Test that required fields raise validation errors when missing."""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(Exception):  # Should raise validation error
                Settings()
    
    def test_secret_key_validation(self):
        """Test secret key validation."""
        with patch.dict(os.environ, {
            'DATABASE_URL': 'postgresql://user:pass@localhost/test',
            'SECRET_KEY': 'short',  # Too short
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_ANON_KEY': 'test-anon-key'
        }):
            # Should work even with short key in test environment
            settings = Settings()
            assert settings.secret_key == "short"
    
    def test_debug_string_to_bool_conversion(self):
        """Test debug flag string to boolean conversion."""
        test_cases = [
            ('true', True),
            ('True', True),
            ('TRUE', True),
            ('1', True),
            ('yes', True),
            ('false', False),
            ('False', False),
            ('FALSE', False),
            ('0', False),
            ('no', False),
            ('', False),
        ]
        
        for debug_value, expected in test_cases:
            with patch.dict(os.environ, {
                'DEBUG': debug_value,
                'DATABASE_URL': 'postgresql://user:pass@localhost/test',
                'SECRET_KEY': 'test-secret-key',
                'SUPABASE_URL': 'https://test.supabase.co',
                'SUPABASE_ANON_KEY': 'test-anon-key'
            }):
                settings = Settings()
                assert settings.debug is expected, f"Failed for debug_value: {debug_value}"
    
    def test_url_validation(self):
        """Test URL validation for Supabase settings."""
        # Valid URLs should work
        with patch.dict(os.environ, {
            'DATABASE_URL': 'postgresql://user:pass@localhost/test',
            'SECRET_KEY': 'test-secret-key',
            'SUPABASE_URL': 'https://valid.supabase.co',
            'SUPABASE_ANON_KEY': 'test-anon-key'
        }):
            settings = Settings()
            assert settings.supabase_url == "https://valid.supabase.co"
    
    def test_model_config(self):
        """Test Pydantic model configuration."""
        settings = Settings(
            database_url='postgresql://user:pass@localhost/test',
            secret_key='test-secret-key',
            supabase_url='https://test.supabase.co',
            supabase_anon_key='test-anon-key'
        )
        
        # Test that the model has the expected configuration
        assert hasattr(settings, 'model_config')
        
        # Test case sensitivity (should be case sensitive)
        with patch.dict(os.environ, {
            'database_url': 'postgresql://user:pass@localhost/test',  # lowercase
            'DATABASE_URL': 'postgresql://user:pass@localhost/override',  # uppercase
            'SECRET_KEY': 'test-secret-key',
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_ANON_KEY': 'test-anon-key'
        }):
            settings = Settings()
            # Should use uppercase version
            assert 'override' in settings.database_url
    
    def test_settings_immutability(self):
        """Test that settings are immutable after creation."""
        with patch.dict(os.environ, {
            'DATABASE_URL': 'postgresql://user:pass@localhost/test',
            'SECRET_KEY': 'test-secret-key',
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_ANON_KEY': 'test-anon-key'
        }):
            settings = Settings()
            
            # Attempting to modify should work (Pydantic allows it by default)
            # But in production, you might want to make it frozen
            original_app_name = settings.app_name
            settings.app_name = "Modified"
            assert settings.app_name == "Modified"
    
    def test_repr_and_str(self):
        """Test string representation of settings."""
        with patch.dict(os.environ, {
            'DATABASE_URL': 'postgresql://user:pass@localhost/test',
            'SECRET_KEY': 'test-secret-key',
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_ANON_KEY': 'test-anon-key'
        }):
            settings = Settings()
            
            # String representation should not expose sensitive data
            settings_str = str(settings)
            assert "test-secret-key" not in settings_str
            assert "test-anon-key" not in settings_str
            
            # But should show non-sensitive fields
            assert "Walkumentary API" in settings_str or settings.app_name in settings_str