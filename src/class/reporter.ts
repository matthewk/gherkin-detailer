import { Reader } from './reader';
import { Analyzer } from './analyzer';
import * as Mustache from 'mustache';
import * as fs from 'fs';
import * as del from 'del';

type ReporterTemplatesList = {
  meta: string;
  footer: string;
  files: string;
  features: string;
};

type ReporterTemplatePartialsList = {
  meta: string;
  footer: string;
};

export class Reporter {
  private reader: Reader;
  private analyzer: Analyzer;
  private folderToReadReport = './';
  private folderToWriteReport = './report/gherkin-detailer/';
  private folderToReadTemplates = './templates/';
  private gherkins: string[] = [];
  private templates: ReporterTemplatesList = <ReporterTemplatesList>{};
  private templatePartials: ReporterTemplatePartialsList = <ReporterTemplatePartialsList>{};

  constructor() {
    this.reader = new Reader();
    this.analyzer = new Analyzer();
    this.reportFeaturesFiles = this.reportFeaturesFiles.bind(this);
  }

  createGherkinsReport(folderToDetail?: string): void {
    this.folderToReadReport = folderToDetail || this.folderToReadReport;

    this.setupReportFolder();
    this.reader.readFeatureFilesFromFolder(this.folderToReadReport, this.reportFeaturesFiles);
  }

  private setupReportFolder(): void {
    if (fs.existsSync(this.folderToWriteReport)) {
      del.sync(this.folderToWriteReport);
    }

    fs.mkdirSync(this.folderToWriteReport, { recursive: true });
    fs.copyFileSync(`${this.folderToReadTemplates}style.css`, `${this.folderToWriteReport}style.css`);
  }

  private async readAllGherkins(readFiles: string[]): Promise<string[]> {
    const rowsFiles: any = [];

    await Promise.all(
      readFiles
        .map(async(readFile: string) => {
          const contentFile = await this.reader.readContentFeatureFile(readFile);
          const rowsFile = this.reader.getRowsFeatureFile(contentFile);
          const gherkinsFile = this.analyzer.getGherkins(rowsFile);
          const dataFile = { ...gherkinsFile, file: readFile.replace(process.cwd(), '.') };
          rowsFiles.push(dataFile);
        })
    );
    return rowsFiles;
  }

  private async readAllTemplates(): Promise<ReporterTemplatesList> {
    const templatesNames = ['meta', 'footer', 'files', 'features'];
    const templates: any = {};
    await Promise.all(
      templatesNames
        .map(async(templateName: string) => {
          const readTemplate = await this.reader.readContentFeatureFile(`${this.folderToReadTemplates}${templateName}.mustache`);
          templates[templateName] = readTemplate;
          return{
            [templateName]: readTemplate
          };
        })
    );

    return templates;
  }

  private prepareReports(): void {
    this.templatePartials = {
      meta: this.templates.meta,
      footer: this.templates.footer
    };
  }

  private writeFilesReport(): void {
    const filesData = {list: this.gherkins};

    const reportFilesList = Mustache.render(this.templates.files, filesData, this.templatePartials);
    fs.writeFile(`${this.folderToWriteReport}files.html`, reportFilesList, writeError => {
      if (writeError) {
        console.error(writeError);
        return;
      }
    });
  }

  private writeFeaturesReport(): void {
    const featuresData = {list: this.gherkins};

    const reportFeaturesList = Mustache.render(this.templates.features, featuresData, this.templatePartials);
    fs.writeFile(`${this.folderToWriteReport}features.html`, reportFeaturesList, writeError => {
      if (writeError) {
        console.error(writeError);
        return;
      }
    });
  }

  private async reportFeaturesFiles(readError: Error, readFiles: string[]): Promise<void> {
    if (readError) {
      console.error(readError);
      return;
    }

    this.gherkins = await this.readAllGherkins(readFiles);
    this.templates = await this.readAllTemplates();

    this.prepareReports();

    this.writeFilesReport();
    this.writeFeaturesReport();
  }
}
