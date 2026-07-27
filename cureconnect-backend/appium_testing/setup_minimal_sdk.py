import os
import shutil
import urllib.request
import zipfile
import requests
from pathlib import Path

def setup_sdk():
    sdk_root = Path(r"D:\android-sdk")
    sdk_root.mkdir(parents=True, exist_ok=True)
    
    # 1. Copy platform-tools if not already present
    platform_tools_dest = sdk_root / "platform-tools"
    platform_tools_src = Path(r"D:\platform-tools-latest-windows\platform-tools")
    
    if platform_tools_src.exists() and not platform_tools_dest.exists():
        print("Copying platform-tools...")
        shutil.copytree(platform_tools_src, platform_tools_dest)
        print("platform-tools copied successfully.")
    
    # 2. Download and extract build-tools r34
    build_tools_dir = sdk_root / "build-tools" / "34.0.0"
    if not build_tools_dir.exists():
        build_tools_dir.mkdir(parents=True, exist_ok=True)
        url = "https://dl.google.com/android/repository/build-tools_r34-windows.zip"
        zip_path = sdk_root / "build-tools.zip"
        
        print("Downloading build-tools r34...")
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, stream=True)
        r.raise_for_status()
        with open(zip_path, "wb") as f:
            f.write(r.content)
        print("Download complete. Extracting...")
        
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            # The zip contains a directory "android-14" (which corresponds to build-tools 34)
            # We want to extract its contents directly into build_tools_dir
            temp_extract = sdk_root / "build-tools-temp"
            zip_ref.extractall(temp_extract)
            
            # Find the extracted folder
            extracted_folder = next(temp_extract.iterdir())
            for item in extracted_folder.iterdir():
                shutil.move(str(item), str(build_tools_dir))
                
            shutil.rmtree(temp_extract)
            
        zip_path.unlink()
        print("build-tools extracted successfully.")
    
    # 3. Create dummy platforms folder to satisfy Appium validation
    platforms_dir = sdk_root / "platforms" / "android-34"
    platforms_dir.mkdir(parents=True, exist_ok=True)
    
    # Create empty source.properties in platforms/android-34
    source_properties = platforms_dir / "source.properties"
    if not source_properties.exists():
        with open(source_properties, "w") as f:
            f.write("Platform.Version=14\nAndroidVersion.ApiLevel=34\n")
            
    print("Minimal Android SDK setup complete in D:\\android-sdk!")

if __name__ == "__main__":
    setup_sdk()
