// component.js
// Generic Program Builder renderer + state manager.
// Business calculations (loss -> payout) deliberately do NOT live here.

(() => {
  "use strict";

  const CONFIG = window.REINSURANCE_CONFIG;
  if (!CONFIG) throw new Error("REINSURANCE_CONFIG missing. Load config.js before component.js.");

  const state = {
    version: 1,
    programs: []
  };

  let programSeq = 0;
  let componentSeq = 0;

  const $ = (selector, root = document) => root.querySelector(selector);

  function uid(prefix) {
    if (prefix === "program") programSeq += 1;
    else componentSeq += 1;
    return `${prefix}-${prefix === "program" ? programSeq : componentSeq}`;
  }

  function defaultValues(type) {
    const definition = CONFIG.componentTypes[type];
    const values = {};
    definition.fields.forEach(field => {
      if (field.widget !== "computed") values[field.key] = field.default ?? "";
    });
    return values;
  }

  function createProgram(name) {
    const program = {
      id: uid("program"),
      name: name || `Programme ${state.programs.length + 1}`,
      components: []
    };
    state.programs.push(program);
    render();
    return program.id;
  }

  function deleteProgram(programId) {
    const index = state.programs.findIndex(p => p.id === programId);
    if (index >= 0) state.programs.splice(index, 1);
    render();
  }

  function addComponent(programId, type = "quotaShare") {
    const program = state.programs.find(p => p.id === programId);
    if (!program || !CONFIG.componentTypes[type]) return;

    program.components.push({
      id: uid("component"),
      type,
      values: defaultValues(type)
    });
    render();
  }

  function deleteComponent(programId, componentId) {
    const program = state.programs.find(p => p.id === programId);
    if (!program) return;
    program.components = program.components.filter(c => c.id !== componentId);
    render();
  }

  function moveComponent(programId, componentId, direction) {
    const program = state.programs.find(p => p.id === programId);
    if (!program) return;

    const index = program.components.findIndex(c => c.id === componentId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= program.components.length) return;

    [program.components[index], program.components[target]] =
      [program.components[target], program.components[index]];
    render();
  }

  function changeComponentType(programId, componentId, type) {
    const program = state.programs.find(p => p.id === programId);
    const component = program?.components.find(c => c.id === componentId);
    if (!component || !CONFIG.componentTypes[type]) return;

    component.type = type;
    component.values = defaultValues(type);
    render();
  }

  function updateValue(programId, componentId, key, value) {
    const program = state.programs.find(p => p.id === programId);
    const component = program?.components.find(c => c.id === componentId);
    if (!component) return;
    component.values[key] = value;

    // Only refresh values depending on other values; don't rebuild the card.
    document.querySelectorAll(`[data-computed-for="${componentId}"]`).forEach(node => {
      const field = CONFIG.componentTypes[component.type].fields.find(f => f.key === node.dataset.fieldKey);
      if (field?.compute) node.textContent = formatComputed(field.compute(component.values), field.unit);
    });

    updateCardSummary(componentId, component);
    emitChange();
  }

  function formatComputed(value, unit) {
    const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
    return `${safeValue}${unit ? ` ${unit}` : ""}`;
  }

  function updateCardSummary(componentId, component) {
    const node = document.querySelector(`[data-summary-for="${componentId}"]`);
    const definition = CONFIG.componentTypes[component.type];
    if (node && definition.summary) node.textContent = definition.summary(component.values);
  }

  function buildTypeSelect(programId, component) {
    const select = document.createElement("select");
    select.className = "form-select";
    select.setAttribute("aria-label", "Type de composant");

    const groups = {};
    Object.entries(CONFIG.componentTypes).forEach(([key, definition]) => {
      (groups[definition.category] ||= []).push([key, definition]);
    });

    Object.entries(groups).forEach(([category, entries]) => {
      const group = document.createElement("optgroup");
      group.label = category;
      entries.forEach(([key, definition]) => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = definition.label;
        option.selected = component.type === key;
        group.appendChild(option);
      });
      select.appendChild(group);
    });

    select.addEventListener("change", e => changeComponentType(programId, component.id, e.target.value));
    return select;
  }

  function buildField(programId, component, field) {
    const row = document.createElement("div");
    row.className = "component-field";

    const label = document.createElement("label");
    label.className = "text-small text-secondary";
    label.textContent = field.label;
    row.appendChild(label);

    const controlWrap = document.createElement("div");
    controlWrap.className = "component-field-control";

    if (field.widget === "number") {
      const input = document.createElement("input");
      input.type = "number";
      input.className = "form-input";
      input.value = component.values[field.key];
      if (field.min !== undefined) input.min = field.min;
      if (field.max !== undefined) input.max = field.max;
      if (field.step !== undefined) input.step = field.step;
      input.addEventListener("input", e => updateValue(programId, component.id, field.key, Number(e.target.value)));
      controlWrap.appendChild(input);
    }

    if (field.widget === "select") {
      const select = document.createElement("select");
      select.className = "form-select";
      field.options.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        option.selected = String(component.values[field.key]) === String(value);
        select.appendChild(option);
      });
      select.addEventListener("change", e => updateValue(programId, component.id, field.key, e.target.value));
      controlWrap.appendChild(select);
    }

    if (field.widget === "text") {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "form-input";
      input.value = component.values[field.key] ?? "";
      input.addEventListener("input", e => updateValue(programId, component.id, field.key, e.target.value));
      controlWrap.appendChild(input);
    }

    if (field.widget === "computed") {
      const output = document.createElement("output");
      output.className = "component-computed";
      output.dataset.computedFor = component.id;
      output.dataset.fieldKey = field.key;
      output.textContent = formatComputed(field.compute(component.values), field.unit);
      controlWrap.appendChild(output);
    } else if (field.unit) {
      const unit = document.createElement("span");
      unit.className = "text-small text-secondary";
      unit.textContent = field.unit;
      controlWrap.appendChild(unit);
    }

    row.appendChild(controlWrap);
    return row;
  }

  function buildComponentCard(program, component, index) {
    const definition = CONFIG.componentTypes[component.type];
    const card = document.createElement("article");
    card.className = "component-card";
    card.dataset.componentId = component.id;

    const header = document.createElement("div");
    header.className = "component-card-header";

    const order = document.createElement("span");
    order.className = "badge";
    order.textContent = String(index + 1).padStart(2, "0");

    const actions = document.createElement("div");
    actions.className = "component-actions";

    const left = actionButton("←", "Déplacer à gauche", () => moveComponent(program.id, component.id, -1));
    left.disabled = index === 0;
    const right = actionButton("→", "Déplacer à droite", () => moveComponent(program.id, component.id, 1));
    right.disabled = index === program.components.length - 1;
    const remove = actionButton("×", "Supprimer", () => deleteComponent(program.id, component.id));

    actions.append(left, right, remove);
    header.append(order, actions);

    const typeSelect = buildTypeSelect(program.id, component);

    const summary = document.createElement("div");
    summary.className = "text-small text-secondary component-summary";
    summary.dataset.summaryFor = component.id;
    summary.textContent = definition.summary ? definition.summary(component.values) : definition.label;

    const fields = document.createElement("div");
    fields.className = "component-fields";
    definition.fields.forEach(field => fields.appendChild(buildField(program.id, component, field)));

    card.append(header, typeSelect, summary, fields);
    return card;
  }

  function actionButton(text, label, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-secondary btn-sm";
    button.textContent = text;
    button.setAttribute("aria-label", label);
    button.addEventListener("click", handler);
    return button;
  }

  function buildProgramRow(program) {
    const row = document.createElement("article");
    row.className = "program-row";
    row.dataset.programId = program.id;

    const label = document.createElement("div");
    label.className = "program-label";

    const name = document.createElement("input");
    name.type = "text";
    name.className = "form-input";
    name.value = program.name;
    name.setAttribute("aria-label", "Nom du programme");
    name.addEventListener("input", e => {
      program.name = e.target.value;
      emitChange();
    });

    const remove = actionButton("Supprimer", "Supprimer le programme", () => deleteProgram(program.id));
    label.append(name, remove);

    const components = document.createElement("div");
    components.className = "program-components";
    components.dataset.componentsFor = program.id;

    program.components.forEach((component, index) => {
      components.appendChild(buildComponentCard(program, component, index));
    });

    const addSlot = document.createElement("div");
    addSlot.className = "add-component-slot";
    const add = actionButton("+ Composant", "Ajouter un composant", () => addComponent(program.id));
    addSlot.appendChild(add);
    components.appendChild(addSlot);

    row.append(label, components);
    return row;
  }

  function render() {
    const canvas = $("#programs-canvas");
    if (!canvas) return;
    canvas.replaceChildren();
    state.programs.forEach(program => canvas.appendChild(buildProgramRow(program)));
    emitChange();
  }

  function snapshot() {
    // Deliberately return only serializable business state.
    return JSON.parse(JSON.stringify(state));
  }

  function emitChange() {
    document.dispatchEvent(new CustomEvent("reinsurance:program-change", {
      detail: snapshot()
    }));
  }

  function init() {
    const addProgramButton = $("#add-program");
    if (!$("#programs-canvas")) return;

    // Replace the static HTML placeholder with state-driven rendering.
    createProgram("Programme 1");

    addProgramButton?.addEventListener("click", () => createProgram());

    // The global Add component button targets the last program for now.
    $("#add-component")?.addEventListener("click", () => {
      if (!state.programs.length) createProgram();
      const last = state.programs[state.programs.length - 1];
      addComponent(last.id);
    });
  }

  // Public API: future Charges/Payout code can consume this without knowing the DOM.
  window.ReinsuranceBuilder = {
    getModel: snapshot,
    addProgram: createProgram,
    addComponent,
    render
  };

  document.addEventListener("DOMContentLoaded", init);
})();
