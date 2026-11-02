# -*- coding: utf-8 -*-
"""把仓库里的站点文件上传到阿里云 OSS。

环境变量：
  OSS_ENDPOINT  oss-cn-hongkong.aliyuncs.com（带 https:// 也行）
  OSS_BUCKET    Bucket 名称
  OSS_AK        AccessKey ID
  OSS_SK        AccessKey Secret
"""
import os
import sys
import mimetypes

import oss2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SKIP_DIRS = {".git", ".github", "preview", "版本存档", "tools", "node_modules"}
SKIP_FILES = {".gitignore", "AGENTS.md", "CHANGELOG.md", "README.md"}
SKIP_EXT = {".cmd", ".ps1", ".py", ".md", ".log"}

TYPE_MAP = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".ico": "image/x-icon",
}


def main():
    endpoint = (os.environ.get("OSS_ENDPOINT") or "").strip()
    bucket_name = (os.environ.get("OSS_BUCKET") or "").strip()
    ak = (os.environ.get("OSS_AK") or "").strip()
    sk = (os.environ.get("OSS_SK") or "").strip()

    for name, value in (("OSS_ENDPOINT", endpoint), ("OSS_BUCKET", bucket_name),
                        ("OSS_AK", ak), ("OSS_SK", sk)):
        if not value:
            print("缺少环境变量", name)
            return 1

    endpoint = endpoint.replace("https://", "").replace("http://", "").strip("/")
    if not endpoint.startswith("oss-"):
        print("endpoint 看起来不对：", endpoint)
        return 1

    print("endpoint =", endpoint)
    print("bucket   =", bucket_name)
    print("ak 长度  =", len(ak), " sk 长度 =", len(sk))

    bucket = oss2.Bucket(oss2.Auth(ak, sk), "https://" + endpoint, bucket_name)

    files = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith("_恢复前_")]
        for name in filenames:
            if name in SKIP_FILES:
                continue
            if os.path.splitext(name)[1].lower() in SKIP_EXT:
                continue
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, ROOT).replace("\\", "/")
            files.append((rel, full))

    print("待上传文件数:", len(files))

    uploaded, failed = 0, []
    for rel, full in files:
        ext = os.path.splitext(rel)[1].lower()
        # 数据文件（后台改的内容）必须不缓存，否则用户看到的是旧内容
        is_data = rel.startswith("assets/data/")
        no_cache = is_data or ext in (".html", ".xml", ".txt", ".json")

        headers = {
            "Content-Type": TYPE_MAP.get(ext, mimetypes.guess_type(rel)[0] or "application/octet-stream"),
            "Cache-Control": "no-cache, max-age=0, must-revalidate" if no_cache else "public, max-age=604800",
        }
        try:
            bucket.put_object_from_file(rel, full, headers=headers)
            uploaded += 1
        except Exception as exc:  # noqa: BLE001
            failed.append((rel, str(exc)[:150]))

    print("成功:", uploaded, "失败:", len(failed))
    for rel, err in failed[:10]:
        print("  FAIL", rel, err)
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
