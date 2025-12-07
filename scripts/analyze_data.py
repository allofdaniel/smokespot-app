#!/usr/bin/env python3
"""Analyze CSV databases and photos to prepare consolidated data"""

import csv
import os
import json
from pathlib import Path

# Paths
BASE_DIR = Path("C:/Users/allof/PyCharmMiscProject")
FULL_DB = BASE_DIR / "smoking_areas_full_db_parallel.csv"
WORLDWIDE_DB = BASE_DIR / "smoking_areas_worldwide.csv"
PHOTOS_DIR = BASE_DIR / "downloaded_photos"
PHOTOS_WORLDWIDE_DIR = BASE_DIR / "downloaded_photos_worldwide"

def analyze_csv(filepath, name):
    """Analyze a CSV file"""
    print(f"\n=== {name} ===")
    print(f"Path: {filepath}")

    if not filepath.exists():
        print("File not found!")
        return

    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Total rows: {len(rows)}")
    print(f"Columns: {list(rows[0].keys()) if rows else 'None'}")

    # Check for IDs and photos
    has_id = 0
    has_photos = 0
    photo_urls = []

    id_field = 'Id' if 'Id' in rows[0] else 'coordinate_id'
    photo_field = 'Site Photos' if 'Site Photos' in rows[0] else 'site_photos'

    for row in rows:
        if row.get(id_field) and str(row[id_field]).strip():
            has_id += 1
        if row.get(photo_field) and str(row[photo_field]).strip():
            has_photos += 1
            photo_urls.append(row[photo_field])

    print(f"Rows with ID: {has_id}")
    print(f"Rows with photos: {has_photos}")

    if photo_urls:
        print(f"Sample photo URLs: {photo_urls[:3]}")

    # Sample rows
    print("\nSample rows:")
    for i, row in enumerate(rows[:3]):
        print(f"  {i+1}. ID={row.get(id_field)}, Name={row.get('Name', row.get('name', ''))[:40]}, Photos={row.get(photo_field, '')[:60]}")

def analyze_photos(folder, name):
    """Analyze photo folder"""
    print(f"\n=== {name} ===")
    print(f"Path: {folder}")

    if not folder.exists():
        print("Folder not found!")
        return {}

    files = list(folder.glob("*.jpg")) + list(folder.glob("*.png"))
    print(f"Total photos: {len(files)}")

    # Group by ID (filename format: {id}_{number}.jpg)
    ids = {}
    for f in files:
        parts = f.stem.split('_')
        if parts:
            photo_id = parts[0]
            if photo_id not in ids:
                ids[photo_id] = []
            ids[photo_id].append(f.name)

    print(f"Unique IDs with photos: {len(ids)}")
    print(f"Sample: {list(ids.items())[:5]}")

    return ids

if __name__ == "__main__":
    print("=" * 60)
    print("DATA ANALYSIS REPORT")
    print("=" * 60)

    # Analyze CSVs
    analyze_csv(FULL_DB, "Full Database (Japan)")
    analyze_csv(WORLDWIDE_DB, "Worldwide Database")

    # Analyze photos
    japan_photos = analyze_photos(PHOTOS_DIR, "Japan Photos")
    worldwide_photos = analyze_photos(PHOTOS_WORLDWIDE_DIR, "Worldwide Photos")

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Japan photos folder has {len(japan_photos)} unique spot IDs")
    print(f"Worldwide photos folder has {len(worldwide_photos)} unique spot IDs")
