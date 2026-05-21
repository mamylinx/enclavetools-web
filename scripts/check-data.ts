import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ValidationIssues {
  missing_url: string[];
  missing_protocol: string[];
  missing_ref: string[];
  missing_slug: string[];
  out_of_order: string[];
  invalid_structure: string[];
}

const issues: ValidationIssues = {
  missing_url: [],
  missing_protocol: [],
  missing_ref: [],
  missing_slug: [],
  out_of_order: [],
  invalid_structure: []
};

let totalTools = 0;

function validateTool(tool: any) {
  const identifier = `${tool.name}`;

  if (!tool.url) {
    issues.missing_url.push(identifier);
  } else {
    if (!tool.url.startsWith('http://') && !tool.url.startsWith('https://')) {
      issues.missing_protocol.push(identifier);
    }
    try {
      const url = new URL(tool.url);
      if (url.searchParams.get('ref') !== 'enclavetools.com') {
        issues.missing_ref.push(identifier);
      }
    } catch (e) {
      issues.missing_ref.push(`${identifier} (Invalid URL)`);
    }
  }

  if (!tool.slug) {
    issues.missing_slug.push(identifier);
  }
}

try {
  console.log("Loading tools from local JSON file...");
  const toolsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/tools.json'), 'utf-8'));
  
  // Flatten all tools from categories
  const allTools = toolsData.tools.flatMap((cat: any) => 
    cat.content.map((tool: any) => ({
      ...tool,
      category: cat.category,
    }))
  );

  allTools.forEach((tool) => {
    totalTools++;
    validateTool(tool);
  });

  console.log(`\nReport Summary:`);
  console.log(`Total tools processed: ${totalTools}`);
  console.log(`Issues found: ${Object.values(issues).flat().length}`);

  if (issues.missing_url.length > 0) {
    console.log("\n❌ Missing URLs:");
    issues.missing_url.forEach(i => console.log(`   - ${i}`));
  }

  if (issues.missing_protocol.length > 0) {
    console.log("\n❌ Missing Protocol (http/https):");
    issues.missing_protocol.forEach(i => console.log(`   - ${i}`));
  }

  if (issues.missing_ref.length > 0) {
    console.log("\n❌ Missing ref parameter (?ref=enclavetools.com):");
    issues.missing_ref.forEach(i => console.log(`   - ${i}`));
  }

  if (issues.missing_slug.length > 0) {
    console.log("\n❌ Missing Slugs:");
    issues.missing_slug.forEach(i => console.log(`   - ${i}`));
  }

  if (issues.out_of_order.length > 0) {
    console.log("\n❌ Alphabetical Order Issues:");
    issues.out_of_order.forEach(i => console.log(`   - ${i}`));
  }

  if (issues.invalid_structure.length > 0) {
    console.log("\n❌ Invalid Structure:");
    issues.invalid_structure.forEach(i => console.log(`   - ${i}`));
  }

  const issueCount = Object.values(issues).flat().length;
  if (issueCount === 0) {
    console.log("\n✅ Data check passed! No issues found.");
  } else {
    process.exit(1);
  }
} catch (error: any) {
  console.error('❌ Error checking data:', error.message);
  process.exit(1);
}
