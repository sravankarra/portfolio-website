#!/usr/bin/env python3
"""
Portfolio Website Startup Script
Run this file to start your portfolio website
"""

import os
import sys
import subprocess

def check_dependencies():
    """Check if required packages are installed"""
    try:
        import flask
        print("✓ Flask is installed")
        return True
    except ImportError:
        print("✗ Flask is not installed")
        return False

def install_dependencies():
    """Install required dependencies"""
    print("Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("✗ Failed to install dependencies")
        return False

def main():
    print("🚀 Starting Karra Sravan's Portfolio Website...")
    print("=" * 50)
    
    # Check if dependencies are installed
    if not check_dependencies():
        print("\nInstalling required dependencies...")
        if not install_dependencies():
            print("Failed to install dependencies. Please run: pip install -r requirements.txt")
            return
    
    print("\nStarting the portfolio website...")
    print("📱 Main Portfolio: http://localhost:5000")
    print("⚙️  Admin Panel: http://localhost:5000/admin")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 50)
    
    # Start the Flask application
    os.system(f"{sys.executable} app.py")

if __name__ == "__main__":
    main() 