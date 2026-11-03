// config.js
// Source of truth for the Program Builder UI.
// No DOM logic here: this file only describes available treaty components.

window.REINSURANCE_CONFIG = {
  version: 1,

  componentTypes: {
    quotaShare: {
      label: "Quota Share",
      category: "Proportionnel",
      summary: ({ cession }) => `${cession}% ceded`,
      fields: [
        { key: "cession", label: "Cession", widget: "number", default: 30, min: 0, max: 100, step: 1, unit: "%" }
      ]
    },

    surplus: {
      label: "Surplus",
      category: "Proportionnel",
      summary: ({ retention, lines }) => `${lines} lines · retention ${retention} M€`,
      fields: [
        { key: "retention", label: "Retention", widget: "number", default: 5, min: 0, step: 0.1, unit: "M€" },
        { key: "lines", label: "Lines", widget: "number", default: 4, min: 1, step: 1 },
        {
          key: "capacity",
          label: "Treaty capacity",
          widget: "computed",
          unit: "M€",
          compute: values => Number(values.retention || 0) * Number(values.lines || 0)
        }
      ]
    },

    perRiskXL: {
      label: "Per Risk XL",
      category: "Non proportionnel",
      summary: ({ limit, attachment }) => `${limit} M€ xs ${attachment} M€`,
      fields: [
        { key: "attachment", label: "Attachment", widget: "number", default: 10, min: 0, step: 0.1, unit: "M€" },
        { key: "limit", label: "Limit", widget: "number", default: 20, min: 0, step: 0.1, unit: "M€" }
      ]
    },

    occurrenceXL: {
      label: "Occurrence / Cat XL",
      category: "Non proportionnel",
      summary: ({ limit, attachment }) => `${limit} M€ xs ${attachment} M€`,
      fields: [
        { key: "attachment", label: "Attachment", widget: "number", default: 20, min: 0, step: 0.1, unit: "M€" },
        { key: "limit", label: "Limit", widget: "number", default: 50, min: 0, step: 0.1, unit: "M€" },
        { key: "reinstatements", label: "Reinstatements", widget: "select", default: "1", options: ["0", "1", "2", "3"] },
        { key: "reinstatementRate", label: "Reinstatement rate", widget: "number", default: 100, min: 0, step: 1, unit: "%" },
        { key: "hoursClause", label: "Hours clause", widget: "select", default: "None", options: ["None", "72h", "96h", "168h"] }
      ]
    },

    aggregateXL: {
      label: "Aggregate XL",
      category: "Non proportionnel",
      summary: ({ limit, attachment }) => `${limit} M€ xs ${attachment} M€ annual`,
      fields: [
        { key: "attachment", label: "Annual attachment", widget: "number", default: 100, min: 0, step: 0.1, unit: "M€" },
        { key: "limit", label: "Annual limit", widget: "number", default: 50, min: 0, step: 0.1, unit: "M€" }
      ]
    },

    stopLoss: {
      label: "Stop Loss",
      category: "Non proportionnel",
      summary: ({ attachment, limit }) => `${limit}% xs ${attachment}% LR`,
      fields: [
        { key: "attachment", label: "Attachment LR", widget: "number", default: 120, min: 0, step: 1, unit: "%" },
        { key: "limit", label: "Limit", widget: "number", default: 50, min: 0, step: 1, unit: "%" }
      ]
    }
  }
};
