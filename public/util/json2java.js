const JAVA_INT_MAX_VALUE = 2147483647;
const bindings = {};

$(function () {
    initBindings();
    initListeners();
    initMainAceEditor();
});

function initBindings() {
    // copy area
    bindings.copyArea = $("#copyArea");
    // editor
    bindings.editor = ace.edit("editor");
    // form
    bindings.classPackage = $("#classPackage");
    bindings.classPrefix = $("#classPrefix");
    bindings.className = $("#className");
    bindings.optionsEmptyConstructor = $("#optionsEmptyConstructor");
    bindings.optionsUsePrimitives = $("#optionsUsePrimitives");
    bindings.optionsAddGetter = $("#optionsAddGetter");
    bindings.optionsAddSetter = $("#optionsAddSetter");
    // log
    bindings.logger = $("#logger");
    // buttons
    bindings.btnCopyJSON = $("#actionCopy");
    bindings.btnPasteJSON = $("#actionPaste");
    bindings.btnFormat = $("#actionFormat");
    bindings.btnGenerate = $("#ationGenerate");
    // result modal
    bindings.resultsModal = $("#resultsModal");
}

function initListeners() {
    var btnCopyJSON = bindings.btnCopyJSON;
    var btnPasteJSON = bindings.btnPasteJSON;
    var btnFormat = bindings.btnFormat;
    var btnGenerate = bindings.btnGenerate;
    var resultsModal = bindings.resultsModal;

    btnCopyJSON.click(function (e) {
        hideLog();
        bindings.copyArea.text(getEditorCode());
        copyText(copyArea);
    });

    btnPasteJSON.click(function (e) {
        hideLog();
        try {
            navigator.clipboard.readText()
                .then(text => {
                    try {
                        var entity = JSON.parse(text);
                        setEditorCode(
                            JSON.stringify(entity, null, 2)
                        );
                    } catch (ex) { }
                })
                .catch(err => {
                    showLog('Failed to read clipboard contents: ', err);
                });
        } catch (ex) {

        }
    });

    btnFormat.click(function (e) {
        hideLog();
        var text = getEditorCode();
        try {
            var entity = JSON.parse(text);
            setEditorCode(
                JSON.stringify(entity, null, 2)
            );
        } catch (ex) {
            showLog(ex);
        }
    });

    btnGenerate.click(function (e) {
        hideLog();
        if (isValidForm()) {
            var options = {
                packageName: bindings.classPackage.val(),
                prefix: bindings.classPrefix.val().capitalize(),
                className: bindings.className.val().capitalize(),
                refJSON: JSON.parse(getEditorCode())
            };
            compose(options, onClassComposed);
        }
    });

    resultsModal.on('hidden.bs.modal', function (e) {
        console.debug("removing cards");
        resultsModal.find(".card").remove();
    });

    resultsModal.on("click", ".copy-button", function (e) {
        var card = $(e.target).closest(".card");
        var copySrc = card.find(".copy-source");
        if (card) {
            copyText(copySrc);
        }
    });

    setEditorCode(
        JSON.stringify({ "foo": "aValue", "bar": "bValue" }, null, 2)
    );
}

function initMainAceEditor() {
    var editor = bindings.editor;
    editor.setTheme("ace/theme/github");
    editor.session.setMode("ace/mode/json");
}

function hideLog() {
    var logger = bindings.logger;
    logger.hide();
    logger.find("p").remove();
}
function showLog(message) {
    if (typeof message === "string") {
        console.debug(message);
    } else {
        console.error(message);
    }

    var logger = bindings.logger;
    logger.append(
        $("<p>").addClass("m-0").text("* " + message)
    );
    logger.show();

    bindings.editor.resize()
}

function setEditorCode(code) {
    var editor = bindings.editor;
    editor.session.setValue(code);
}

function getEditorCode() {
    var editor = bindings.editor;
    return editor.getValue();
}

function isValidForm() {
    var valid = true;
    try {
        try {
            var entity = JSON.parse(getEditorCode());
            if (Array.isArray(entity)) {
                showLog("JSON Arrays no soportados");
                valid = false;
            }
        } catch (ex) {
            throw ex;
        }
        if (bindings.className.val().length == 0) {
            bindings.className.addClass("is-invalid");
            valid = false;
        } else {
            bindings.className.removeClass("is-invalid");
        }
    } catch (ex) {
        showLog(ex);
        valid = false;
    }
    return valid;
}

function copyText(txtArea) {
    if (txtArea) {
        txtArea.select();
        document.execCommand("copy");
    }
}

function compose(options, callback) {
    const usePrimitives = bindings.optionsUsePrimitives.is(":checked");
    const addGetters = bindings.optionsAddGetter.is(":checked");
    const addSetters = bindings.optionsAddSetter.is(":checked");
    const addEmptyConstructor = bindings.optionsEmptyConstructor.is(":checked");

    const packageName = options.packageName || "";
    const prefix = options.prefix || "";
    const className = prefix + options.className;
    const refJSON = options.refJSON;

    if (!className) {
        showLog("Nombre de clase no definido");
        callback(true, options);
        return;
    }
    if (!refJSON || typeof refJSON !== "object") {
        showLog(`${className} es falsy [${refJSON}]`);
        callback(true, options);
        return;
    }
    if (Array.isArray(refJSON)) {
        showLog("JSON Arrays no soportados");
        callback(true, options);
        return;
    }

    let code = [];
    let keys = Object.keys(refJSON);
    let fields = {};

    if (packageName) {
        code.push(`package ${packageName};`);
        code.push("");
    }
    code.push("import java.util.logging.Logger;");
    code.push("import javax.annotation.Nonnull;");
    code.push("import org.json.JSONObject;");
    code.push("");
    code.push(`public class ${className} {`);
    {
        // Define logger
        code.push(`private static final Logger log = Logger.getLogger(${className}.class.getSimpleName());`);
        // Define JSON key constants
        for (let key of keys) {
            code.push(`private static final String KEY_${key.toUpperCase()} = "${key}";`);
        }

        code.push("");

        // Define object fields
        for (let key of keys) {
            let value = refJSON[key];
            var valueType = "";
            var fromJSON = true;

            // Infere data type
            if (typeof value == "string") {
                valueType = "String";
            } else if (typeof value == "boolean") {
                valueType = usePrimitives ? "boolean" : "Boolean";
            } else if (typeof value == "number") {
                if (value > JAVA_INT_MAX_VALUE) {
                    valueType = usePrimitives ? "long" : "Long";
                } else {
                    let stringValue = "" + value;
                    if (stringValue.includes(".")) {
                        valueType = usePrimitives ? "float" : "Float";
                    } else {
                        valueType = usePrimitives ? "int" : "Integer";
                    }
                }
            } else if (typeof value == "object" && !Array.isArray(value)) {
                valueType = key.capitalize();
                compose({
                    packageName: packageName,
                    prefix: prefix,
                    className: valueType,
                    refJSON: value
                }, callback);
                valueType = prefix + valueType;
                fromJSON = false;
            } else {
                showLog(`key [${key}] no se puede asignar a un campo. Es un arreglo?`)
                continue;
            }

            code.push(`private ${valueType} ${key};`)
            fields[key] = {
                "dataType": valueType,
                "fromJSON": fromJSON
            };
        }

        code.push("");

        // Define empty constructor
        if (addEmptyConstructor) {
            code.push(`public ${className}() {}`);
            code.push("");
        }

        // Define JSON constructor
        code.push(`public ${className}(@Nonnull JSONObject json) {`);
        {
            // Write JSON validation
            code.push(`if (json == null) {`);
            {
                code.push(`log.warning("json was null");`);
                code.push(`return;`);
            }
            code.push(`}`)

            // Initialize fields
            for (let key in fields) {
                var jsonKey = `KEY_${key.toUpperCase()}`;
                var prop = fields[key];
                if (prop.fromJSON) {
                    // Assign optional values from JSON
                    code.push(`this.${key} = json.opt${prop.dataType.capitalize()}(${jsonKey});`);
                } else {
                    // Create new object from JSON
                    code.push(`if (json.optJSONObject(${jsonKey}) != null) {`);
                    {
                        code.push(`this.${key} = new ${prop.dataType}(json.optJSONObject(${jsonKey}));`);
                    }
                    code.push("}");
                }
            }
        }
        code.push("}");
        code.push("");

        // Define getters / setters
        for (let key in fields) {
            // define getter
            if (addGetters) {
                code.push(`public ${fields[key].dataType} get${key.capitalize()}() {`)
                code.push(`return ${key};`);
                code.push("}");
                code.push("");
            }
            // define setter
            if (addSetters) {
                code.push(`public void set${key.capitalize()}(${fields[key].dataType} ${key}) {`)
                code.push(`this.${key} = ${key};`);
                code.push("}");
                code.push("");
            }
        }
    }
    code.push("}")
    options["code"] = code.join("\n");
    callback(false, options);
}

function onClassComposed(err, options) {
    if (err) {
        showLog(`Error al crear la clase [${options.className}]`);
        return;
    }
    var modal = bindings.resultsModal;
    var card = $($("#fileCardTemplate").html().trim());

    card.find(".card-header").text(options.className + ".java");
    card.find(".file-source").val(options.code);

    modal.find(".modal-body").append(card);
    modal.modal('show');
}

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
