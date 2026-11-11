import os
import zipfile

def create_source_zip():
    output_filename = "spendwise-ai.zip"
    excluded_dirs = {
        'node_modules',
        '.git',
        '.tools',
        'dist',
        '.system_generated',
        '.turbo',
        '.vscode'
    }
    excluded_files = {
        output_filename,
        '.env',
        '.DS_Store'
    }

    print(f"Creating clean source bundle: {output_filename}...")

    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            # Exclude directories
            dirs[:] = [d for d in dirs if d not in excluded_dirs and not d.startswith('.')]

            for file in files:
                if file in excluded_files or file.endswith('.log') or file.endswith('.tsbuildinfo'):
                    continue
                
                file_path = os.path.join(root, file)
                archive_name = os.path.relpath(file_path, '.')
                zipf.write(file_path, archive_name)

    size_mb = os.path.getsize(output_filename) / (1024 * 1024)
    print(f"Bundle created successfully! Size: {size_mb:.2f} MB")

if __name__ == '__main__':
    create_source_zip()
