function removeAnnotations(inputString) {
    // Split the string by new lines
    let lines = inputString.split('\n');

    // Process each line
    lines = lines.map(line => {
        line = line.replace(/\/\/.*$/, ''); // Remove single-line comments
        return line;
    });

    // Join the lines back into a single string
    let data = lines.join('\n');

    // Remove multi-line comments
    data = data.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove empty lines
    data = data.replace(/^\s*\n/gm, '');

    // Remove leading/trailing whitespace
    data = data.trim();

    return data;
}

module.exports = removeAnnotations;