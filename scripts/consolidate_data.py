#!/usr/bin/env python3
"""
Consolidate CSV databases and match with downloaded photos
Creates a unified JSON database for the smoking area app
"""

import csv
import os
import json
import shutil
import re
from pathlib import Path
from urllib.parse import urlparse

# Paths
BASE_DIR = Path("C:/Users/allof/PyCharmMiscProject")
APP_DIR = BASE_DIR / "smoking-area-app"

# Source CSVs
FULL_DB = BASE_DIR / "smoking_areas_full_db_parallel.csv"
WORLDWIDE_DB = BASE_DIR / "smoking_areas_worldwide.csv"

# Photo directories
PHOTOS_JAPAN = BASE_DIR / "downloaded_photos"
PHOTOS_WORLDWIDE = BASE_DIR / "downloaded_photos_worldwide"

# Output paths
OUTPUT_PHOTOS_DIR = APP_DIR / "public" / "photos"
OUTPUT_JSON = APP_DIR / "public" / "data" / "spots.json"


def extract_id_from_url(url):
    """Extract spot ID from URL like https://share-map.net/smoking-area/japan/nagasaki/sasebo/107427/"""
    if not url:
        return None

    # Remove trailing slash and get last segment
    url = url.rstrip('/')
    parts = url.split('/')

    # Check if last part is numeric (the ID)
    if parts and parts[-1].isdigit():
        return parts[-1]

    return None


def get_photos_for_id(spot_id, all_photos):
    """Find all photos matching a spot ID from combined photo dictionary"""
    photos = []

    if spot_id in all_photos:
        for photo_info in all_photos[spot_id]:
            photos.append(photo_info['path'])

    return photos


def scan_photo_directory(folder, subfolder_name):
    """Scan photo directory and group by ID with path info"""
    if not folder.exists():
        print(f"Warning: Photo folder not found: {folder}")
        return {}

    photos_by_id = {}

    for f in folder.iterdir():
        if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
            # Filename format: {id}_{number}.jpg
            parts = f.stem.split('_')
            if parts and parts[0].isdigit():
                photo_id = parts[0]
                if photo_id not in photos_by_id:
                    photos_by_id[photo_id] = []
                photos_by_id[photo_id].append({
                    'filename': f.name,
                    'path': f"/photos/{subfolder_name}/{f.name}",
                    'source_folder': folder
                })

    return photos_by_id


def merge_photo_dicts(*dicts):
    """Merge multiple photo dictionaries"""
    merged = {}
    for d in dicts:
        for photo_id, photos in d.items():
            if photo_id not in merged:
                merged[photo_id] = []
            merged[photo_id].extend(photos)
    return merged


def read_csv_with_encoding(filepath):
    """Read CSV file, trying different encodings"""
    encodings = ['utf-8-sig', 'utf-8', 'cp949', 'euc-kr', 'latin-1']

    for encoding in encodings:
        try:
            with open(filepath, 'r', encoding=encoding) as f:
                reader = csv.DictReader(f)
                rows = list(reader)
                if rows:
                    return rows
        except (UnicodeDecodeError, UnicodeError):
            continue

    raise ValueError(f"Could not read CSV with any known encoding: {filepath}")


def process_csv(filepath, all_photos, source_name):
    """Process a CSV file and return spots with matched photos"""
    spots = []

    if not filepath.exists():
        print(f"Warning: CSV not found: {filepath}")
        return spots

    rows = read_csv_with_encoding(filepath)
    print(f"Processing {source_name}: {len(rows)} rows")

    if not rows:
        return spots

    # Detect column names (handle different naming conventions)
    sample = rows[0]
    columns = {
        'id': next((k for k in sample.keys() if k.lower() in ['id', 'coordinate_id']), None),
        'name': next((k for k in sample.keys() if k.lower() in ['name', 'location name']), None),
        'lat': next((k for k in sample.keys() if k.lower() in ['latitude', 'lat']), None),
        'lng': next((k for k in sample.keys() if k.lower() in ['longitude', 'lng', 'lon']), None),
        'address': next((k for k in sample.keys() if 'address' in k.lower()), None),
        'url': next((k for k in sample.keys() if 'detail' in k.lower() and 'url' in k.lower()), None),
        'photo': next((k for k in sample.keys() if 'photo' in k.lower()), None),
        'memo': next((k for k in sample.keys() if k.lower() in ['memo', 'description', 'note']), None),
    }

    print(f"  Detected columns: {columns}")

    matched_count = 0

    for row in rows:
        try:
            # Get coordinates
            lat_str = row.get(columns['lat'], '')
            lng_str = row.get(columns['lng'], '')

            if not lat_str or not lng_str:
                continue

            lat = float(lat_str)
            lng = float(lng_str)

            # Skip invalid coordinates
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                continue

            # Get or extract ID
            spot_id = row.get(columns['id'], '').strip() if columns['id'] else None

            if not spot_id and columns['url']:
                # Extract ID from URL
                url = row.get(columns['url'], '')
                spot_id = extract_id_from_url(url)

            # Get name
            name = row.get(columns['name'], '').strip() if columns['name'] else ''
            if not name:
                name = f"Spot {spot_id}" if spot_id else f"Unknown ({lat:.4f}, {lng:.4f})"

            # Get address
            address = row.get(columns['address'], '').strip() if columns['address'] else ''

            # Get memo
            memo = row.get(columns['memo'], '').strip() if columns['memo'] else ''

            # Match photos from combined photo dictionary
            photos = []
            if spot_id:
                photos = get_photos_for_id(spot_id, all_photos)
                if photos:
                    matched_count += 1

            spot = {
                'id': spot_id or f"{source_name}_{len(spots)}",
                'name': name,
                'lat': lat,
                'lng': lng,
                'type': 'allowed',  # Default to allowed (smoking area)
                'source': source_name,
            }

            if address:
                spot['address'] = address
            if memo:
                spot['memo'] = memo
            if photos:
                spot['photos'] = photos

            spots.append(spot)

        except (ValueError, TypeError) as e:
            continue

    print(f"  Processed {len(spots)} valid spots, {matched_count} with photos")
    return spots


def copy_photos_from_dict(all_photos, output_base_dir):
    """Copy all photo files to app's public folder"""
    copied = 0

    for spot_id, photos in all_photos.items():
        for photo_info in photos:
            source_folder = photo_info['source_folder']
            filename = photo_info['filename']
            path = photo_info['path']

            # Determine destination subfolder from path
            # path is like /photos/japan/filename.jpg
            parts = path.strip('/').split('/')
            if len(parts) >= 3:
                subfolder = parts[1]  # 'japan' or 'worldwide'
                dest_dir = output_base_dir / subfolder
                dest_dir.mkdir(parents=True, exist_ok=True)

                src = source_folder / filename
                dst = dest_dir / filename

                if src.exists() and not dst.exists():
                    shutil.copy2(src, dst)
                    copied += 1

    return copied


def main():
    print("=" * 60)
    print("SMOKING AREA DATABASE CONSOLIDATION")
    print("=" * 60)

    # Step 1: Scan photo directories
    print("\n[1/4] Scanning photo directories...")
    japan_photos = scan_photo_directory(PHOTOS_JAPAN, "japan")
    worldwide_photos = scan_photo_directory(PHOTOS_WORLDWIDE, "worldwide")

    print(f"  Japan photos: {sum(len(v) for v in japan_photos.values())} files for {len(japan_photos)} spots")
    print(f"  Worldwide photos: {sum(len(v) for v in worldwide_photos.values())} files for {len(worldwide_photos)} spots")

    # Merge all photos into one dictionary
    all_photos = merge_photo_dicts(japan_photos, worldwide_photos)
    print(f"  Combined: {sum(len(v) for v in all_photos.values())} files for {len(all_photos)} spots")

    # Step 2: Process CSVs
    print("\n[2/4] Processing CSV databases...")
    all_spots = []

    japan_spots = process_csv(FULL_DB, all_photos, "japan")
    all_spots.extend(japan_spots)

    worldwide_spots = process_csv(WORLDWIDE_DB, all_photos, "worldwide")
    all_spots.extend(worldwide_spots)

    # Step 3: Copy photos
    print("\n[3/4] Copying photos to app directory...")
    copied_total = copy_photos_from_dict(all_photos, OUTPUT_PHOTOS_DIR)
    print(f"  Copied {copied_total} total photos")

    # Step 4: Write JSON
    print("\n[4/4] Writing consolidated JSON...")
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)

    output_data = {
        'version': '1.0',
        'generated': str(Path(__file__).name),
        'totalSpots': len(all_spots),
        'spotsWithPhotos': sum(1 for s in all_spots if s.get('photos')),
        'spots': all_spots
    }

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"  Wrote {OUTPUT_JSON}")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total spots: {len(all_spots)}")
    print(f"  - Japan: {len(japan_spots)}")
    print(f"  - Worldwide: {len(worldwide_spots)}")
    print(f"Spots with photos: {output_data['spotsWithPhotos']}")
    print(f"Photos copied: {copied_total}")
    print(f"Output JSON: {OUTPUT_JSON}")
    print(f"Photos directory: {OUTPUT_PHOTOS_DIR}")


if __name__ == "__main__":
    main()
