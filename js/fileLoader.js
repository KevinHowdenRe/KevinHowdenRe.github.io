(() => {

    "use strict";


    // =====================================================
    // FILE LOADER
    // =====================================================

    async function load(file, options = {}) {
		console.log("OK1");
        if (!file) {
            throw new Error("Aucun fichier sélectionné.");
        }


        const extension = file.name
            .split(".")
            .pop()
            .toLowerCase();


        let data;


        switch (extension) {

            case "csv":
                data = await loadCSV(file);
                break;

            case "xlsx":
            case "xls":
                data = await loadExcel(file);
                break;

            default:
                throw new Error(
                    "Format non supporté. Utilisez un fichier CSV ou Excel."
                );

        }


        if (!data.length) {
            throw new Error("Le fichier ne contient aucune donnée.");
        }


        validateColumns(
            data,
            options.requiredColumns || []
        );
		console.log("OK2");

        return {
            data,
            fileName: file.name,
            fileType: extension
        };

    }


    // =====================================================
    // CSV
    // =====================================================

    function loadCSV(file) {

        return new Promise((resolve, reject) => {

            Papa.parse(file, {

                header: true,

                skipEmptyLines: true,

                dynamicTyping: true,

                complete: (results) => {

                    if (results.errors.length) {

                        reject(
                            new Error(
                                results.errors[0].message
                            )
                        );

                        return;

                    }


                    resolve(results.data);

                },

                error: (error) => {
                    reject(error);
                }

            });

        });

    }


    // =====================================================
    // EXCEL
    // =====================================================

    async function loadExcel(file) {

        const buffer =
            await file.arrayBuffer();


        const workbook =
            XLSX.read(buffer, {
                type: "array"
            });


        const firstSheet =
            workbook.SheetNames[0];


        const worksheet =
            workbook.Sheets[firstSheet];


        return XLSX.utils.sheet_to_json(
            worksheet,
            {
                defval: null
            }
        );

    }


    // =====================================================
    // VALIDATION
    // =====================================================

    function validateColumns(data, requiredColumns) {

        if (!requiredColumns.length) {
            return;
        }


        const columns =
            Object.keys(data[0]);


        const missingColumns =
            requiredColumns.filter(
                column => !columns.includes(column)
            );


        if (missingColumns.length) {

            throw new Error(
                "Colonne(s) manquante(s) : " +
                missingColumns.join(", ")
            );

        }

    }


    // =====================================================
    // PUBLIC API
    // =====================================================

    window.FileLoader = {
        load
    };

})();