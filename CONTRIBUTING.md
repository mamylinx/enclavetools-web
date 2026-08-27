# Contributing to Enclavetools

### Getting Started

This project uses [Bun](https://bun.sh/) for development and dependency management.

```bash
# Clone the repository
git clone https://github.com/mamylinx/enclavetools-web
cd enclavetools-web

# Install dependencies
bun install

# Start the development server
bun run dev

# Create a new branch for your AI tool
git checkout -b add/your-ai-tool
```

### Adding a Tool

The primary source of truth for all tools is `src/data/metadata/tools/<slug>.json`. Each tool has its own dedicated JSON file.

> [!NOTE]
> Do NOT edit files in `src/data/generated/`. These are compiled automatically during the build process.

To add a new tool, create a new file named `<slug>.json` in `src/data/metadata/tools/` (e.g. `src/data/metadata/tools/my-tool.json`).

**Tool Format:**
```json
{
  "slug": "my-tool",
  "title": "My Tool Name",
  "category": "llm-inference",
  "body": "A brief summary description.",
  "plain_description": "User-friendly plain English description.",
  "technical_description": "Technical architecture and deployment details.",
  "tag": "LLM Runtime",
  "url": "https://my-tool.com",
  "github_url": "https://github.com/org/my-tool",
  "docs_url": "https://docs.my-tool.com",
  "date-added": "YYYY-MM-DD",
  "last_updated": "YYYY-MM-DD",
  "last_verified": "YYYY-MM-DD",
  "license": "Apache-2.0",
  "maturity": "Production / Stable",
  "setup_difficulty": "Easy",
  "featured": false,
  "hardware": ["CPU", "GPU (NVIDIA)"],
  "deployment": ["Docker", "Bare Metal"],
  "language": ["Python", "Rust"],
  "use_cases": ["Model Serving"],
  "personas": ["Developer"],
  "features": ["Docker available", "REST API"],
  "works_with": []
}
```

### Verification & Data Compilation

After adding or updating a tool, compile the data and run the test suite:

```bash
bun run prepare-data
bun run test:run
```

### Creating a Pull Request

```bash
# Add and commit your changes
git add src/data/metadata/tools/my-tool.json
git commit -m "Add [Tool Name]"

# Push to your branch
git push -u origin add/my-tool
```

### Guidelines
- **Alphabetical Order**: Always maintain alphabetical order within categories.
- **Categorization**: Use existing categories. If unsure, use "Xtras" and suggest a new category in your PR description.
- **Conciseness**: Keep the description concise and informative.
- **Protocol**: All URLs should include a valid protocol `https://…` and remain accessible.
- **Ref Parameter**: Make sure the URL includes the reference parameter: `?ref=enclavetools.com`
- **Validation**: Verify your JSON syntax and data validity by running `bun run check-data`.