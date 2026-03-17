import { exec } from 'child_process'
import { readFileSync } from 'node:fs';

async function main() {
  const stdout = await new Promise<string>((resolve, reject) => exec('pnpm lint:dry', (error, stdout, stderr) => resolve(stdout)));
  let updated = true;
  while (updated) {
    updated = false;
    for (const fileOutput of stdout.split(/\n{2,3}/).slice(1, -1)) {
      const lines = fileOutput.split('\n');
      const file = lines[0];
      const linesToReSort: number[] = []
      for (const line of lines) {
        if (!line.endsWith('sort-imports')) continue;
        linesToReSort.push(Number.parseInt(line.match(/^\s*(\d+)/)[1]));
        updated = true;
      }
      console.log(`Problem in file ${file} on lines ${linesToReSort}`);
      const fileContent = readFileSync(file, 'utf8');
      const fileLines = fileContent.split('\n');
      const imports = [...fileContent.matchAll(/^((\/\/|\/\*)[^;]\n)?import [^;]+;(\s*\/\/.*)?$/gm).map((import_) => import_[0])];
      //const filesImported = imports.map((import_) => import_.match(/import[^;]+('([^']+)'|"([^"]+)");/)[2]);
      console.log('Original imports :', imports)
      for (const lineToReSort of linesToReSort.toReversed()) {
        const importIndex = imports.findIndex((import_) => import_.includes(fileLines[lineToReSort - 1]));
        [imports[importIndex], imports[importIndex + 1]] = [imports[importIndex + 1], imports[importIndex]];
        //[filesImported[importIndex], filesImported[importIndex + 1]] = [filesImported[importIndex + 1], filesImported[importIndex]];
      }
      console.log('Re-imported imports :', imports);
    }
  }
}

main()
