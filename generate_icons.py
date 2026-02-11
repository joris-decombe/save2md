"""Generate Save2MD extension icons at 16, 32, 48, and 128px."""

from PIL import Image, ImageDraw, ImageFont
import os

SIZES = [16, 32, 48, 128]
OUT_DIR = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(OUT_DIR, exist_ok=True)

for size in SIZES:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background: rounded rectangle (document shape)
    pad = max(1, size // 16)
    corner = max(2, size // 8)
    # Document body
    draw.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=corner,
        fill="#4A90D9",
    )

    # Inner white area (page feel)
    inner_pad = max(2, size // 6)
    inner_corner = max(1, corner // 2)
    draw.rounded_rectangle(
        [inner_pad, inner_pad, size - inner_pad, size - inner_pad],
        radius=inner_corner,
        fill="#FFFFFF",
    )

    # Draw "MD" text or lines depending on size
    if size >= 32:
        # Draw "MD" text
        font_size = size // 3
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except (IOError, OSError):
            font = ImageFont.load_default()
        text = "MD"
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = (size - tw) // 2
        ty = (size - th) // 2 - bbox[1]
        draw.text((tx, ty), text, fill="#4A90D9", font=font)

        # Small down-arrow at bottom right
        arrow_size = max(3, size // 8)
        ax = size - inner_pad - arrow_size
        ay = size - inner_pad - arrow_size
        draw.polygon(
            [(ax, ay), (ax + arrow_size, ay), (ax + arrow_size // 2, ay + arrow_size)],
            fill="#2ECC71",
        )
    else:
        # 16px: simple lines to suggest text
        lx1 = inner_pad + 2
        lx2 = size - inner_pad - 2
        ly = inner_pad + 3
        line_h = max(1, size // 8)
        for i in range(3):
            y = ly + i * (line_h + 1)
            end_x = lx2 if i < 2 else lx1 + (lx2 - lx1) * 2 // 3
            draw.line([(lx1, y), (end_x, y)], fill="#4A90D9", width=1)

    path = os.path.join(OUT_DIR, f"icon{size}.png")
    img.save(path, "PNG")
    print(f"Created {path}")

print("Done.")
