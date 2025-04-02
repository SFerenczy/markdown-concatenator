import * as fs from "fs/promises";
import * as path from "path";

// --- Configuration ---
const OUTPUT_FILENAME = "concatenated_output.md"; // Hardcoded output filename
const DIR_HEADER_PREFIX = "# Directory:"; // Prefix to distinguish directory headers
const FILE_HEADER_PREFIX = "## File:"; // Prefix to distinguish file headers (using ## for lower level)
// --- End Configuration ---

interface FileInfo {
  fullPath: string;
  relativePath: string; // Path relative to the root input directory
  isDirectory: boolean;
  name: string;
}

/**
 * Recursively finds all markdown files and directories within a given directory.
 * @param dirPath The absolute path to the directory to scan.
 * @param rootDir The absolute path of the initial root directory (for relative path calculation).
 * @returns A promise that resolves to an array of FileInfo objects.
 */
async function findMarkdownRecursive(
  dirPath: string,
  rootDir: string
): Promise<FileInfo[]> {
  let results: FileInfo[] = [];
  const dirents = await fs.readdir(dirPath, { withFileTypes: true });

  // Sort dirents alphabetically, directories first
  dirents.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const dirent of dirents) {
    const fullPath = path.join(dirPath, dirent.name);
    const relativePath = path.relative(rootDir, fullPath);

    if (dirent.isDirectory()) {
      // Add directory info
      results.push({
        fullPath,
        relativePath,
        isDirectory: true,
        name: dirent.name,
      });
      // Recurse into subdirectory
      const subResults = await findMarkdownRecursive(fullPath, rootDir);
      results = results.concat(subResults);
    } else if (dirent.isFile() && dirent.name.toLowerCase().endsWith(".md")) {
      // Add markdown file info
      results.push({
        fullPath,
        relativePath,
        isDirectory: false,
        name: dirent.name,
      });
    }
  }
  return results;
}

/**
 * Main function to process the directory and generate the output file.
 */
async function run() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error("Usage: node dist/index.js <directory_path>");
    process.exit(1);
  }

  const inputDirPath = path.resolve(args[0]); // Get absolute path

  try {
    const stats = await fs.stat(inputDirPath);
    if (!stats.isDirectory()) {
      console.error(`Error: '${inputDirPath}' is not a directory.`);
      process.exit(1);
    }
  } catch (err: any) {
    if (err.code === "ENOENT") {
      console.error(`Error: Directory '${inputDirPath}' not found.`);
    } else {
      console.error(`Error accessing directory '${inputDirPath}':`, err);
    }
    process.exit(1);
  }

  console.log(`Scanning directory: ${inputDirPath}`);

  try {
    const fileInfos = await findMarkdownRecursive(inputDirPath, inputDirPath);

    const outputContent: string[] = [];
    let lastProcessedDirRelative = "."; // Track the last directory header added

    for (const info of fileInfos) {
      const currentDirRelative = path.dirname(info.relativePath);

      // Add Directory Header if it's a new directory *and* it's actually a directory entry
      // or if the file belongs to a directory we haven't added a header for yet.
      if (info.isDirectory && info.relativePath !== lastProcessedDirRelative) {
        // Only add header for the directory itself, not inferred from files
        outputContent.push(`${DIR_HEADER_PREFIX} ${info.relativePath}\n\n`);
        lastProcessedDirRelative = info.relativePath; // Update tracker for actual directory entries
      } else if (
        !info.isDirectory &&
        currentDirRelative !== lastProcessedDirRelative &&
        currentDirRelative !== "."
      ) {
        // If we encounter a file in a subdir we haven't explicitly added a header for (e.g. empty dir entry)
        // we infer the directory header based on the file's location.
        // This handles cases where a directory might only contain files and no subdirs.
        const parentDirParts = currentDirRelative.split(path.sep);
        let cumulativePath = "";
        // Add potentially missing parent directory headers
        for (const part of parentDirParts) {
          cumulativePath = cumulativePath
            ? path.join(cumulativePath, part)
            : part;
          // Check if this specific sub-path header was already potentially added
          // This requires searching back in the output or keeping a set of added headers.
          // Simpler: Assume we need to add if `lastProcessedDirRelative` doesn't contain it as a prefix.
          if (!lastProcessedDirRelative.startsWith(cumulativePath)) {
            outputContent.push(`${DIR_HEADER_PREFIX} ${cumulativePath}\n\n`);
          }
        }
        lastProcessedDirRelative = currentDirRelative; // Update tracked directory based on file
      }

      if (!info.isDirectory) {
        // Add File Header
        outputContent.push(`${FILE_HEADER_PREFIX} ${info.name}\n\n`); // Use ## for file names

        // Read file content
        try {
          const content = await fs.readFile(info.fullPath, "utf8");
          outputContent.push(content);
          outputContent.push("\n\n---\n\n"); // Add separator between files
        } catch (readErr) {
          console.warn(
            `Warning: Could not read file '${info.fullPath}':`,
            readErr
          );
          outputContent.push(`*Error reading file ${info.name}*\n\n---\n\n`);
        }
      }
    }

    const finalOutput = outputContent.join("");
    const outputFilePath = path.join(process.cwd(), OUTPUT_FILENAME); // Output in current working dir

    await fs.writeFile(outputFilePath, finalOutput);

    console.log(
      `Successfully concatenated markdown files into: ${outputFilePath}`
    );
  } catch (err) {
    console.error("An error occurred during processing:", err);
    process.exit(1);
  }
}

// Execute the main function
run();
