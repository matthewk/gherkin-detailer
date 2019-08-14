import * as program from 'commander';

export type ConfigurerData = {
  analysisFolder?: string;
  outputFolder?: string;
  templateFolder: string;
  theme: string;
};

export class Configurer {
  constructor() {
    this.setupOptions();
  }

  private setupOptions(): void {
    const version = '2.1.2';

    program
      .version(version, '-v, --version')
      .allowUnknownOption()
      .option('-a, --analysis [analysis]', 'Select folder to analyse')
      .option('-o, --output [output]', 'Select folder to output')
      .option('-templates, --templates [templates]', 'Select folder to templates', /^.+$/i, 'templates')
      .option('-t, --theme [theme]', 'Select report theme', /^(white|black)$/i, 'white')
      .parse(process.argv);
  }

  fetchData(): ConfigurerData {
    const userAnalysisFolder = program.analysis || '';
    const userOutputFolder = program.output || '';
    const userTemplatFolder = program.templates;
    const userTheme = program.theme;

    return {
      analysisFolder: userAnalysisFolder,
      outputFolder: userOutputFolder,
      templateFolder: userTemplatFolder,
      theme: userTheme
    };
  }
}
