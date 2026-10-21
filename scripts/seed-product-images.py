#!/usr/bin/env python3
"""Upload photos for demo products that have no images yet."""

import argparse
import getpass
import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from uuid import uuid4


PHOTOS = Path(__file__).resolve().parent / "seed-product-images"


def call(url, *, headers=None, data=None):
    with urlopen(Request(url, headers=headers or {}, data=data), timeout=30) as response:
        return response.read()


def upload(base_url, token, product_id, photo):
    boundary = uuid4().hex
    image = photo.read_bytes()
    body = (
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{photo.name}"\r\n'
        'Content-Type: image/webp\r\n\r\n'
    ).encode() + image + f"\r\n--{boundary}--\r\n".encode()
    result = json.loads(call(
        f"{base_url}/api/v1/admin/products/{product_id}/images",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        data=body,
    ))
    image_url = result["images"][-1]["url"]
    if call(base_url + image_url) != image:
        raise ValueError(f"The backend did not return the uploaded image for {photo.stem}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8080, help="local backend port")
    parser.add_argument("--email", default="admin@example.com", help="admin account email")
    args = parser.parse_args()
    base_url = f"http://127.0.0.1:{args.port}"
    photos = sorted(PHOTOS.glob("*.webp"))
    if not photos:
        parser.exit(1, f"No product photos found in {PHOTOS}\n")

    password = getpass.getpass(f"Password for {args.email}: ")
    try:
        login = json.loads(call(
            f"{base_url}/api/v1/auth/login",
            headers={"Content-Type": "application/json"},
            data=json.dumps({"email": args.email, "password": password}).encode(),
        ))
    except URLError as error:
        parser.exit(1, f"Could not sign in to {base_url}: {error}\n")

    uploaded = skipped = failed = 0
    for photo in photos:
        try:
            product = json.loads(call(f"{base_url}/api/v1/products/{photo.stem}"))
            if product["images"]:
                print(f"Kept existing images: {photo.stem}")
                skipped += 1
                continue
            upload(base_url, login["accessToken"], product["id"], photo)
            print(f"Uploaded and verified: {photo.stem}")
            uploaded += 1
        except HTTPError as error:
            print(f"Could not add {photo.stem}: HTTP {error.code} {error.read().decode(errors='replace')}")
            failed += 1
        except (OSError, ValueError) as error:
            print(f"Could not add {photo.stem}: {error}")
            failed += 1

    print(f"{uploaded} uploaded, {skipped} already had images, {failed} failed.")
    return int(failed > 0)


if __name__ == "__main__":
    raise SystemExit(main())
