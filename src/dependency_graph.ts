import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';
import { SpelunkerModule } from 'nestjs-spelunker';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await generateDependencyGraph(app);
}
bootstrap();

async function generateDependencyGraph(app: INestApplication) {
  // Module dependencies graph
  const tree = SpelunkerModule.explore(app);
  const root = SpelunkerModule.graph(tree);
  const edges = SpelunkerModule.findGraphEdges(root);
  const mermaidEdges = edges
    .map(({ from, to }) => `  ${from.module.name}-->${to.module.name}`)
    // filter out modules from the chart if you need
    .filter((edge) => !edge.includes('FilteredModule') && !edge.includes('OtherExample'))
    .sort();
  // write into file
  fs.writeFileSync(
    'deps.mermaid',
    `graph LR
${mermaidEdges.join('\n')}`,
  );
}
