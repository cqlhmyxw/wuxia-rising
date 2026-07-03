from PIL import Image, ImageDraw, ImageFont
import os

sizes = {
    "icon_20.png": 20, "icon_20@2x.png": 40, "icon_20@3x.png": 60,
    "icon_29.png": 29, "icon_29@2x.png": 58, "icon_29@3x.png": 87,
    "icon_40.png": 40, "icon_40@2x.png": 80, "icon_40@3x.png": 120,
    "icon_60@2x.png": 120, "icon_60@3x.png": 180,
    "icon_76.png": 76, "icon_76@2x.png": 152,
    "icon_83.5@2x.png": 167,
    "icon_1024.png": 1024,
}

outdir = "/home/ubuntu/wuxia-rising/app-assets/icons"
os.makedirs(outdir, exist_ok=True)

for name, size in sizes.items():
    img = Image.new('RGB', (size, size), (13, 8, 6))
    draw = ImageDraw.Draw(img)
    center = size // 2
    
    # 渐变圆底
    for y in range(size):
        for x in range(size):
            dx, dy = x - center, y - center
            dist = (dx*dx + dy*dy) ** 0.5
            if dist < center * 0.85:
                ratio = dist / (center * 0.85)
                r = min(255, int(60 + (180 - 60) * (1 - ratio)))
                g = min(255, int(30 + (130 - 30) * (1 - ratio)))
                b = min(255, int(15 + (80 - 15) * (1 - ratio)))
                img.putpixel((x, y), (r, g, b))
    
    # 月亮
    mr = size * 0.12
    mx, my = center + size*0.15, center - size*0.15
    for dy in range(-int(mr), int(mr)):
        for dx in range(-int(mr), int(mr)):
            if dx*dx + dy*dy < mr*mr:
                px, py = int(mx+dx), int(my+dy)
                if 0 <= px < size and 0 <= py < size:
                    bri = min(255, int(220 - (dx*dx + dy*dy)**0.5 * 3))
                    img.putpixel((px, py), (bri, max(0,bri-20), max(0,bri-40)))
    
    # 松树
    tx, ty = center, int(center * 1.15)
    th = int(size * 0.2)
    for h in range(th):
        for w in range(-2, 3):
            px, py = tx + w, ty - h
            if 0 <= px < size and 0 <= py < size:
                img.putpixel((px, py), (8, 5, 3))
    
    # 字
    if size >= 60:
        try:
            fnt = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf', max(12, size//10))
            draw.text((center, int(size*0.78)), "武", fill=(212, 197, 169), font=fnt, anchor='mm')
        except:
            pass
    
    img.save(os.path.join(outdir, name))
    print(f"  {name}: {size}x{size}")

print(f"\n✅ 全部完成，{len(sizes)} 个图标")
