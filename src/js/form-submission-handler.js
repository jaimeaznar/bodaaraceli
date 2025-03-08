(function () {
    // get all data in form and return object
    function getFormData(form) {
        var elements = form.elements;
        var honeypot;

        var fields = Object.keys(elements).filter(function (k) {
            if (elements[k].name === "honeypot") {
                honeypot = elements[k].value;
                return false;
            }
            return true;
        }).map(function (k) {
            if (elements[k].name !== undefined) {
                return elements[k].name;
                // special case for Edge's html collection
            } else if (elements[k].length > 0) {
                return elements[k].item(0).name;
            }
        }).filter(function (item, pos, self) {
            return self.indexOf(item) == pos && item;
        });

        var formData = {};
        fields.forEach(function (name) {
            var element = elements[name];

            // singular form elements just have one value
            formData[name] = element.value;

            // when our element has multiple items, get their values
            if (element.length) {
                var data = [];
                for (var i = 0; i < element.length; i++) {
                    var item = element.item(i);
                    if (item.checked || item.selected) {
                        data.push(item.value);
                    }
                }
                formData[name] = data.join(', ');
            }
        });

        // add form-specific values into the data
        formData.formDataNameOrder = JSON.stringify(fields);
        formData.formGoogleSheetName = form.dataset.sheet || "responses"; // default sheet name
        formData.formGoogleSendEmail
            = form.dataset.email || ""; // no email by default

        return { data: formData, honeypot: honeypot };
    }

    function validateForm(form) {
        const errors = [];
        const formData = getFormData(form);
        const data = formData.data;

        // Basic required fields validation
        if (!data.Familia || data.Familia.trim() === '') {
            errors.push("Please provide a name/family name.");
        }

        // Validate adults names if present
        const adultsCount = parseInt(document.getElementById('asistentes')?.value || 0);
        for (let i = 0; i < adultsCount; i++) {
            const adultName = form.querySelector(`input[name="adult_name_${i}"]`)?.value;
            if (!adultName || adultName.trim() === '') {
                errors.push(`Please provide a name for additional adult #${i + 1}`);
            }
        }

        // Validate children names if present
        const childrenCount = parseInt(document.getElementById('menores')?.value || 0);
        for (let i = 0; i < childrenCount; i++) {
            const childName = form.querySelector(`input[name="child_name_${i}"]`)?.value;
            if (!childName || childName.trim() === '') {
                errors.push(`Please provide a name for child #${i + 1}`);
            }
        }

        // Hotel validation
        const selectedRoute = form.querySelector('input[name="ruta"]:checked')?.value;
        if (selectedRoute === 'SI HOTEL' || selectedRoute === 'AMBOS') {
            const hotelName = document.getElementById('hotel-name')?.value;
            if (!hotelName || hotelName.trim() === '') {
                errors.push("Please specify a hotel name when requesting hotel transport.");
            }
        }

        return errors;
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        const form = event.target;

        // Validate form
        const errors = validateForm(form);

        // Clear previous error messages
        const existingErrors = form.querySelectorAll('.alert-danger');
        existingErrors.forEach(error => error.remove());

        // If there are errors, display them and stop submission
        if (errors.length > 0) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.innerHTML = errors.join('<br>');
            form.insertBefore(errorDiv, form.firstChild);
            return false;
        }

        // If validation passes, proceed with submission
        const formData = getFormData(form);
        const data = formData.data;

        if (formData.honeypot) {
            return false;
        }

        disableAllButtons(form);
        var url = form.action;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                form.reset();
                var formElements = form.querySelector(".form-elements")
                if (formElements) {
                    formElements.style.display = "none";
                }
                var thankYouMessage = form.querySelector(".thankyou_message");
                if (thankYouMessage) {
                    thankYouMessage.style.display = "block";
                }
            }
        };

        var encoded = Object.keys(data).map(function (k) {
            return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
        }).join('&');
        xhr.send(encoded);
    }

    function loaded() {
        // bind to the submit event of our form
        var forms = document.querySelectorAll("form.gform");
        for (var i = 0; i < forms.length; i++) {
            forms[i].addEventListener("submit", handleFormSubmit, false);
        }
    };
    document.addEventListener("DOMContentLoaded", loaded, false);

    function disableAllButtons(form) {
        var buttons = form.querySelectorAll("button");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].disabled = true;
        }
    }
})();
