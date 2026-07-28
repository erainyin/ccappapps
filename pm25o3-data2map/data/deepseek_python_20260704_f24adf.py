import json
import math

# ---------- 工具函数 ----------
def haversine(lon1, lat1, lon2, lat2):
    """近似球面距离（km），用于找最近点"""
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2*R*math.atan2(math.sqrt(a), math.sqrt(1-a))

def find_nearest_index(coords, target_lon, target_lat):
    """在坐标列表中找距目标最近点的索引"""
    best_i = 0
    best_dist = float('inf')
    for i, (lon, lat) in enumerate(coords):
        d = haversine(lon, lat, target_lon, target_lat)
        if d < best_dist:
            best_dist = d
            best_i = i
    return best_i

# ---------- 读取原始数据 ----------
with open('china_boundary.geojson', 'r', encoding='utf-8') as f:
    data = json.load(f)

feature = data['features'][0]
geom = feature['geometry']
polys = geom['coordinates']          # MultiPolygon 的所有多边形

# 主大陆多边形（第一个，面积最大）
main_poly = polys[0]
main_ring = main_poly[0]             # 外环坐标，闭合，最后一个点等于第一个点

# 其余多边形均为岛屿（台湾、海南、南海诸岛等）
island_rings = [p[0] for p in polys[1:]]

# 北仑河口（中越陆地边界终点）近似坐标
target_lon, target_lat = 108.3, 21.5

# 找到北仑河口在主环中的最近点索引
k = find_nearest_index(main_ring, target_lon, target_lat)

# ---------- 拆分主环 ----------
# 主环起点为鸭绿江口 (索引0)，终点也是起点 (最后一点重复)
# 陆上边界：从鸭绿江口 (0) 到 北仑河口 (k)
land_coords = main_ring[:k+1]

# 海岸线主段：从北仑河口 (k) 到鸭绿江口 (0)，去除最后重复点
sea_coords = main_ring[k:-1] + [main_ring[0]]

# ---------- 构建输出 GeoJSON ----------
def build_line_feature(coords, props):
    return {
        "type": "Feature",
        "properties": props,
        "geometry": {
            "type": "LineString",
            "coordinates": coords
        }
    }

def build_multiline_feature(lines, props):
    return {
        "type": "Feature",
        "properties": props,
        "geometry": {
            "type": "MultiLineString",
            "coordinates": lines
        }
    }

# 大陆边界（一条线）
land_fc = {
    "type": "FeatureCollection",
    "features": [
        build_line_feature(land_coords, {"type": "大陆边界"})
    ]
}

# 海岸线（主海岸线 + 所有岛屿边界）
all_sea_lines = [sea_coords] + island_rings
sea_fc = {
    "type": "FeatureCollection",
    "features": [
        build_multiline_feature(all_sea_lines, {"type": "海岸线"})
    ]
}

# ---------- 写出文件 ----------
with open('land_boundary.geojson', 'w', encoding='utf-8') as f:
    json.dump(land_fc, f, ensure_ascii=False, indent=2)

with open('coastline.geojson', 'w', encoding='utf-8') as f:
    json.dump(sea_fc, f, ensure_ascii=False, indent=2)

print("拆分完成！")
print("大陆边界 -> land_boundary.geojson")
print("海岸线    -> coastline.geojson")