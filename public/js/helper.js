class helper {
    static setAttributes(element, attributes) {
        for(const key in attributes) {
            if (key === 'textContent') {
                element.textContent = attributes[key];
                continue;
            }

            if (key === 'className') {
                element.className = attributes[key];
                continue;
            }

            element.setAttribute(key, attributes[key]);
        }
    }

    static createSetAttributes(element, attributes) {
        element = document.createElement(element);

        for(const key in attributes) {
            if (key === 'textContent') {
                element.textContent = attributes[key];
                continue;
            }

            if (key === 'className') {
                element.className = attributes[key];
                continue;
            }

            element.setAttribute(key, attributes[key]);
        }

        return element;
    }
}