# Markdown Directory Concatenator

A simple (perhaps slightly stupid) command-line tool written in TypeScript to find all markdown files (`.md`) within a specified directory (and its subdirectories) and concatenate them into a single output markdown file. Completely written by Gemini.

This was primarily built as a basic way to dump the content of something like an [Obsidian](https://obsidian.md/) vault into one document, preserving _some_ structure with directory and file headers. It doesn't handle Obsidian-specific features like links (`[[...]]`) or backlinks intelligently – it just smashes the text together.

## Features

- Recursively searches a directory for `.md` files.
- Sorts directories and files alphabetically for predictable order.
- Adds a Level 1 Markdown header (`# Directory: ...`) for each subdirectory encountered relative to the input directory.
- Adds a Level 2 Markdown header (`## File: ...`) for each Markdown file found.
- Concatenates the content of the Markdown files.
- Adds a horizontal rule (`---`) as a separator between the content of different files.
- Outputs the combined content to a hardcoded file (`concatenated_output.md`) in the directory where the script is run.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## Setup

1.  **Clone the repository (if applicable):**
    ```bash
    # If you have this project in a Git repository
    git clone <your-repo-url>
    cd <repository-directory>
    ```
2.  **Install dependencies:**
    This installs TypeScript, `ts-node`, and necessary type definitions.
    ```bash
    npm install
    # or
    yarn install
    ```

## Usage (with ts-node)

This project uses `ts-node` to allow running the TypeScript script directly without a separate compilation step.

Run the script from your terminal, providing the path to the directory containing your markdown files (like your Obsidian vault) as the only argument:

```bash
npx ts-node src/index.ts <path_to_your_markdown_directory>
```

**Examples:**

- Processing a local directory named `my-notes`:
  ```bash
  npx ts-node src/index.ts ./my-notes
  ```
- Processing an Obsidian vault located at `/Users/me/Documents/MyObsidianVault`:
  ```bash
  npx ts-node src/index.ts "/Users/me/Documents/MyObsidianVault"
  ```
  _(Use quotes if your path contains spaces)_

**Output:**

The script will create a file named `concatenated_output.md` in the directory **from which you ran the command** (your current working directory). This file will contain the merged content.

## Configuration

Some basic settings are hardcoded at the top of the `src/index.ts` file:

- `OUTPUT_FILENAME`: The name of the output file (default: `concatenated_output.md`).
- `DIR_HEADER_PREFIX`: The text used for directory headers (default: `# Directory:`).
- `FILE_HEADER_PREFIX`: The text used for file headers (default: `## File:`).

You can modify these directly in the script if needed. Remember that `ts-node` will pick up the changes the next time you run it.
