import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import dateFnsFormat from 'date-fns/format';
import getProperty from 'lodash/get';
import { fetchSubmissionUniqueItems } from './submissions';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

// export async function generateSubmissionPdf(submissionId) {
//   const { data } = await api.getProperty(`/submissions/${id}?pure=1`);
// }

const styles = {
  header: {
    fontSize: 20,
    bold: true,
    alignment: 'center',
  },
  meta: {
    fontSize: 10,
    color: '#9ca3af',
  },
  question: {
    fontSize: 14,
    bold: true,
    margin: [0, 0, 0, 8],
  },
  answer: {
    color: '#1e293b',
  },
};

const defaultStyle = {
  fontSize: 12,
  bold: false,
};

const SVG = {
  'check-true':
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><g><path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17.99 9L16.58 7.58L9.99 14.17L7.41 11.6L5.99 13.01L9.99 17L17.99 9Z" fill="#374151"/></g></svg>',
  'check-false':
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><g><path d="M19 5V19H5V5H19ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" fill="#374151"/></g></svg>',
  'radio-true':
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><g><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="#374151"/><path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="#374151"/></g></svg>',
  'radio-false':
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><g><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="#374151"/></g></svg>',
};

function getControlSvg(multiple, checked) {
  return SVG[`${multiple ? 'check' : 'radio'}-${Boolean(checked)}`];
}

function formatDate(date, format = 'MMM d, yyyy h:mm a') {
  const parsedDate = parseISO(date);
  return dateFnsFormat(isValid(parsedDate) ? parsedDate : new Date(), format);
}

export default class SubmissionPDF {
  constructor(survey, submission) {
    this.survey = survey;
    this.submission = submission;
    this.isLoading = false;
    this.questionIndex = 0;
    this.docDefinition = {
      content: [],
      styles,
      defaultStyle,
    };
  }

  async download() {
    const maker = await this.generate();
    maker.download();
  }

  async print() {
    const maker = await this.generate();
    maker.print();
  }

  async generate() {
    this.docDefinition.content = [];

    if (this.survey && this.submission) {
      this.generateMeta();

      const revision = this.survey.revisions.find(
        (revision) => revision.version === this.submission.meta.survey.version
      );

      if (revision && Array.isArray(revision.controls)) {
        this.questionIndex = 0;
        this.isLoading = false;
        for (const control of revision.controls) {
          await this.generateControl(control);
        }
        this.isLoading = true;
      }
    }

    return pdfMake.createPdf(this.docDefinition);
  }

  generateMeta() {
    const metaGroup = `Submitted to: ${this.submission.meta.group.path}`;
    const { dateSubmitted, dateModified, dateCreated } = this.submission.meta;
    const metaDate = `Submitted at: ${formatDate(dateSubmitted || dateModified || dateCreated)}`;

    this.docDefinition.content.push(
      {
        text: `Survey: ${this.survey.name}`,
        style: 'header',
      },
      {
        text: `\n${metaGroup}\n${metaDate}`,
        style: 'meta',
      },
      '\n\n'
    );
  }

  async generateControl(control, path = []) {
    const generator = {
      string: this.generateNormalControl,
      number: this.generateNormalControl,
      date: this.generateDateControl,
      location: this.generateLocationControl,
      selectSingle: this.generateRadioControl,
      selectMultiple: this.generateCheckControl,
      ontology: this.generateDropdownControl,
      matrix: this.generateMatrixControl,
    }[control.type];

    if (generator) {
      await generator.bind(this)(control, path);
    }

    if (Array.isArray(control.children)) {
      for (const child of control.children) {
        await this.generateControl(child, [...path, control.name]);
      }
    }
  }

  generateNormalControl(control, path = []) {
    const key = [...path, control.name, 'value'];
    const value = getProperty(this.submission.data, key);
    this.docDefinition.content.push(this.getQuestion(control), this.getTextAnswer(value), '\n\n');
  }

  generateDateControl(control, path = []) {
    const key = [...path, control.name, 'value'];
    const value = getProperty(this.submission.data, key);
    const date = parseISO(value);
    const dateValue = isValid(date) ? dateFnsFormat(date, 'MMM d, yyyy h:mm a') : null;
    this.docDefinition.content.push(this.getQuestion(control), this.getTextAnswer(dateValue), '\n\n');
  }

  generateLocationControl(control, path = []) {
    const key = [...path, control.name, 'value', 'geometry', 'coordinates'];
    const value = getProperty(this.submission.data, key);
    this.docDefinition.content.push(this.getQuestion(control), this.getTextAnswer(value), '\n\n');
  }

  async generateRadioControl(control, path = []) {
    const key = [...path, control.name, 'value'];
    const value = getProperty(this.submission.data, key);
    const source = await this.getControlSource(control);

    this.docDefinition.content.push(this.getQuestion(control), this.getSelectAnswer(value, source, false, 4), '\n\n');
  }

  async generateCheckControl(control, path = []) {
    const key = [...path, control.name, 'value'];
    const value = getProperty(this.submission.data, key);
    const source = await this.getControlSource(control);

    this.docDefinition.content.push(this.getQuestion(control), this.getSelectAnswer(value, source, true, 4), '\n\n');
  }

  async generateDropdownControl(control, path = []) {
    const key = [...path, control.name, 'value'];
    const value = getProperty(this.submission.data, key);
    const source = await this.getControlSource(control);

    this.docDefinition.content.push(this.getQuestion(control), this.getDropdownAnswer(value, source, 4), '\n\n');
  }

  generateMatrixControl(control, path = []) {
    const headers = getProperty(control, ['options', 'source', 'content']);
    if (!Array.isArray(headers)) {
      return;
    }

    const key = [...path, control.name, 'value'];
    const answer = getProperty(this.submission.data, key) || [];
    const emptyCells = Array(headers.length)
      .fill(0)
      .map(() => ({}));
    const noDataCell = {
      ...this.getTextAnswer(),
      colSpan: headers.length,
      alignment: 'center',
      margin: [0, 4, 0, 4],
    };
    const rows =
      answer.length === 0
        ? [[noDataCell, ...emptyCells].slice(0, -1)]
        : answer.map((row) => headers.map((header) => this.getTextAnswer(getProperty(row, [header.value, 'value']))));

    this.docDefinition.content.push(
      this.getQuestion(control),
      {
        layout: {
          hLineWidth: function (i, node) {
            return 1;
          },
          vLineWidth: function (i, node) {
            return 0;
          },
          hLineColor: function (i, node) {
            return i === 0 || i === node.table.body.length ? styles.answer.color : styles.meta.color;
          },
          fillColor: function (rowIndex, node, columnIndex) {
            return rowIndex % 2 === 1 ? 'white' : '#d1d5db';
          },
        },
        table: {
          headerRows: 1,
          body: [headers.map((header) => header.label || header.value), ...rows],
        },
      },
      '\n\n'
    );
  }

  getQuestion(control) {
    this.questionIndex += 1;

    return {
      text: `${this.questionIndex}. ${control.label || control.hint}`,
      style: 'question',
    };
  }

  getTextAnswer(answer) {
    const text = Array.isArray(answer)
      ? JSON.stringify(answer)
      : answer === null || answer === undefined
      ? 'No answer'
      : answer;
    const hasAnswer = text !== 'No answer';

    return {
      text,
      style: 'answer',
      color: hasAnswer ? styles.answer.color : styles.meta.color,
    };
  }

  getSelectAnswer(answer, source, multiple, cols = 1) {
    const value = Array.isArray(answer) ? answer : answer ? [answer] : [];
    const options = [...source];

    const custom = value.find((val) => val && source.every((item) => item.value !== val));
    if (custom) {
      options.push({ value: custom, label: custom });
    }

    const group = [];
    if (cols === 1) {
      group.push(options);
    } else {
      options.forEach((option, index) => {
        const i = index % cols;
        if (!Array.isArray(group[i])) {
          group[i] = [];
        }
        group[i].push(option);
      });
    }

    const isChecked = (option) => value.includes(option.value);

    return {
      columns: group.map((columnOptions) =>
        columnOptions.map((option) => this.getSelectDefinition(option, multiple, isChecked(option)))
      ),
    };
  }

  getDropdownAnswer(answer, source, cols = 1) {
    const value = Array.isArray(answer) ? answer : answer ? [answer] : [];
    const options = [...source];

    const custom = value.find((val) => val && source.every((item) => item.value !== val));
    if (custom) {
      options.push({ value: custom, label: custom });
    }

    const group = [];
    if (cols === 1) {
      group.push(options);
    } else {
      options.forEach((option, index) => {
        const i = index % cols;
        if (!Array.isArray(group[i])) {
          group[i] = [];
        }
        group[i].push(option);
      });
    }

    const isChecked = (option) => value.includes(option.value);

    return {
      columns: group.map((columnOptions) => ({
        ul: columnOptions.map((option) => ({
          ...this.getTextAnswer(option.label),
          color: isChecked(option) ? 'blue' : styles.answer.color,
        })),
      })),
    };
  }

  getSelectDefinition(option, multiple, checked) {
    return {
      table: {
        widths: [12, '*'],
        body: [
          [
            {
              svg: getControlSvg(multiple, checked),
              fit: [12, 12],
            },
            this.getTextAnswer(option.label),
          ],
        ],
      },
      layout: 'noBorders',
    };
  }

  async getControlSource(control) {
    const source = getProperty(control, 'options.source');
    if (Array.isArray(source)) {
      return source;
    }

    if (typeof source !== 'string') {
      return [];
    }

    const resources = this.survey.resources;
    if (!Array.isArray(resources)) {
      return [];
    }

    const resource = resources.find((resource) => resource.id === source);
    if (!resource) {
      return [];
    }

    if (resource.location === 'EMBEDDED') {
      return resource.content;
    }

    if (resource.location === 'REMOTE') {
      return await fetchSubmissionUniqueItems(resource.content.id, resource.content.path);
    }

    return [];
  }
}
