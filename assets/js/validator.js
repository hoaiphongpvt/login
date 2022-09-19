
function Validator (options) {

    var selectorRule = {}
    var formElement = document.querySelector(options.form)
    if (formElement) {
        //Loại hỏ hành vi submit form
        formElement.onsubmit = (e) => {
            e.preventDefault()
            var isFormValid = true
            //Lặp qua từng rule và validate
            options.rules.forEach(rule => {
                var inputElement = formElement.querySelector(rule.selector)
                var isValid = validate(inputElement, rule)
                if(!isValid) {
                    isFormValid = false
                }
            })
            if (isFormValid) {
                //Trường hợp submit với Javascript
                if (typeof options.onSubmit === 'function') {
                    var enabelInputs = formElement.querySelectorAll('[name]')
                    var formValues = Array.from(enabelInputs).reduce((values, input) => {
                        switch (input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value
                                break
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    values[input.name] = '';
                                    return values
                                }
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value)
                                break
                            case 'file': 
                                values[input.name] = input.files
                            default:
                                values[input.name] = input.value
                        }
                        return values
                    }, {})
                    options.onSubmit(formValues)
                } 
                //Trường hợp mặc định
                else {
                    formElement.submit()
                }
            }
        }
        //Lặp và xử lý các rules
        options.rules.forEach(rule => {
            //Lưu lại các rule cho mỗi input
            if (Array.isArray(selectorRule[rule.selector])) {
                selectorRule[rule.selector].push(rule.test)
            } else {
                selectorRule[rule.selector] = [rule.test]
            }

            var inputElements = formElement.querySelectorAll(rule.selector)
            Array.from(inputElements).forEach((inputElement) => {

                inputElement.onblur = () => {
                    validate(inputElement, rule)
                }
                inputElement.oninput = () => {
                    var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
                    var inputEror = formElement.querySelector(rule.selector)
                    errorElement.innerText = ''
                    inputEror.classList.remove('invalid')
                }
            })
        });
    }

    function getParent (element, selector) {

        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement
            }
            element = element.parentElement
        }
    }

    function validate (inputElement, rule) {

        var errorMessage
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
        var inputEror = formElement.querySelector(rule.selector)
        //Lấy ra các rule của selector
        var rules = selectorRule[rule.selector]
        //Lặp qua từng rule và kiểm tra
        for (var i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    )
                    break
                default:
                    errorMessage = rules[i](inputElement.value)
            }
            //Nếu có lỗi thì dừng kiểm tra
            if (errorMessage) {
                break
            }
        }           
        if (errorMessage) {
            errorElement.innerText = errorMessage
            inputEror.classList.add('invalid')
        }
        else {
            errorElement.innerText = ''
            inputEror.classList.remove('invalid')
        }
        return !errorMessage
    }
}

Validator.isRequired = function (selector,  message) {
    return {
        selector,
        test(value) {
            return value ? undefined : message || 'Please enter this field!'
        }
    }
}

Validator.isEmail= function (selector, message) {
    return {
        selector,
        test(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
            return regex.test(value) ? undefined : message || 'This field must be email!'
        }
    }
}

Validator.minLength = function (selector, min,  message) {
    return {
        selector,
        test(value) {
            return value.length >= min ? undefined : message || `Please enter the minimum ${min} characters!`
        }
    }
}

Validator.isConfirmed = function (selector, getConfirmValue, message) {
    return {
        selector,
        test(value) {
            return value === getConfirmValue() ? undefined :  message || 'Re-entered password is incorrect!'
        }
    }
}