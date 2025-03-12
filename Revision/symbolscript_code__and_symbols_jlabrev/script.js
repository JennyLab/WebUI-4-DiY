class SymbolScriptInterpreter {
    constructor() {
        this.codeInput = document.getElementById('code-input');
        this.runButton = document.getElementById('run-code');
        this.clearButton = document.getElementById('clear-output');
        this.outputArea = document.getElementById('output');
        
        this.variables = {};
        this.functions = {};
        this.loops = {
            'while': this.parseWhileLoop.bind(this),
            'for': this.parseForLoop.bind(this)
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.runButton.addEventListener('click', () => this.executeCode());
        this.clearButton.addEventListener('click', () => this.clearOutput());
    }
    
    clearOutput() {
        this.outputArea.textContent = '';
    }
    
    executeCode() {
        // Reset state
        this.variables = {};
        this.functions = {};
        this.outputArea.textContent = '';
        
        // Split code into lines and process
        const lines = this.codeInput.value.split('\n');
        
        try {
            this.parseLines(lines);
        } catch (error) {
            this.print(`Error: ${error.message}`);
        }
    }
    
    parseLines(lines, localVariables = null) {
        const context = localVariables || this.variables;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines and comments
            if (!line || line.startsWith('#')) continue;
            
            // Check for break statement in loops
            if (line === 'break') {
                return 'break';
            }
            
            // Check for continue statement in loops
            if (line === 'continue') {
                return 'continue';
            }
            
            const result = this.parseLine(line, lines, i, context);
            
            // Handle loop control flow
            if (result === 'break' || result === 'continue') {
                return result;
            }
        }
    }
    
    parseLine(line, lines, lineIndex, context = null) {
        context = context || this.variables;
        
        // Variable declaration
        if (line.startsWith('create variable')) {
            this.parseVariableDeclaration(line, context);
            return;
        }
        
        // Function declaration
        if (line.startsWith('create function')) {
            lineIndex = this.parseFunctionDeclaration(lines, lineIndex);
            return;
        }
        
        // Conditional statement
        if (line.startsWith('if')) {
            return this.parseConditional(line, lines, lineIndex, context);
        }
        
        // Print statement
        if (line.startsWith('print')) {
            this.parsePrint(line, context);
            return;
        }
        
        // While loop
        if (line.startsWith('while')) {
            return this.parseWhileLoop(line, lines, lineIndex, context);
        }
        
        // For loop
        if (line.startsWith('for')) {
            return this.parseForLoop(line, lines, lineIndex, context);
        }
        
        // List/Array support
        if (line.startsWith('create list')) {
            this.parseListDeclaration(line, context);
            return;
        }
        
        // Array/List operations
        if (line.includes('.append(') || line.includes('.remove(')) {
            this.parseListOperation(line, context);
            return;
        }
    }
    
    parseVariableDeclaration(line, context) {
        const parts = line.split('=').map(p => p.trim());
        const varName = parts[0].replace('create variable', '').trim();
        const value = this.evaluateExpression(parts[1], context);
        
        context[varName] = value;
    }
    
    parseListDeclaration(line, context) {
        const parts = line.split('=').map(p => p.trim());
        const listName = parts[0].replace('create list', '').trim();
        
        // If no initial value provided, create an empty list
        const value = parts[1] ? 
            this.evaluateExpression(parts[1], context) : 
            [];
        
        context[listName] = value;
    }
    
    parseListOperation(line, context) {
        // Append operation
        const appendMatch = line.match(/(\w+)\.append\((.*)\)/);
        if (appendMatch) {
            const listName = appendMatch[1];
            const value = this.evaluateExpression(appendMatch[2], context);
            
            if (!context[listName] || !Array.isArray(context[listName])) {
                throw new Error(`List ${listName} is not defined`);
            }
            
            context[listName].push(value);
            return;
        }
        
        // Remove operation
        const removeMatch = line.match(/(\w+)\.remove\((.*)\)/);
        if (removeMatch) {
            const listName = removeMatch[1];
            const index = this.evaluateExpression(removeMatch[2], context);
            
            if (!context[listName] || !Array.isArray(context[listName])) {
                throw new Error(`List ${listName} is not defined`);
            }
            
            context[listName].splice(index, 1);
            return;
        }
    }
    
    parseWhileLoop(line, lines, startIndex, context) {
        const conditionMatch = line.match(/while (.*) do/);
        if (!conditionMatch) {
            throw new Error(`Invalid while loop: ${line}`);
        }
        
        const endIndex = lines.findIndex((l, i) => 
            i > startIndex && l.trim() === 'end'
        );
        
        if (endIndex === -1) {
            throw new Error('Unclosed while loop');
        }
        
        const loopBody = lines.slice(startIndex + 1, endIndex);
        
        while (this.evaluateExpression(conditionMatch[1], context)) {
            const result = this.parseLines(loopBody, {...context});
            
            if (result === 'break') break;
            if (result === 'continue') continue;
        }
    }
    
    parseForLoop(line, lines, startIndex, context) {
        const forMatch = line.match(/for (\w+) in (.*) do/);
        if (!forMatch) {
            throw new Error(`Invalid for loop: ${line}`);
        }
        
        const iteratorVar = forMatch[1];
        const iterableExpr = forMatch[2];
        
        const endIndex = lines.findIndex((l, i) => 
            i > startIndex && l.trim() === 'end'
        );
        
        if (endIndex === -1) {
            throw new Error('Unclosed for loop');
        }
        
        const loopBody = lines.slice(startIndex + 1, endIndex);
        
        const iterable = this.evaluateExpression(iterableExpr, context);
        
        if (!Array.isArray(iterable)) {
            throw new Error(`Cannot iterate over non-list: ${iterableExpr}`);
        }
        
        for (const item of iterable) {
            // Create a new context with the iterator variable
            const loopContext = {...context, [iteratorVar]: item};
            
            const result = this.parseLines(loopBody, loopContext);
            
            if (result === 'break') break;
            if (result === 'continue') continue;
        }
    }
    
    parseFunctionDeclaration(lines, startIndex) {
        const firstLine = lines[startIndex];
        const funcParts = firstLine.match(/create function (\w+)\s*\((.*?)\)/);
        
        if (!funcParts) {
            throw new Error(`Invalid function declaration: ${firstLine}`);
        }
        
        const funcName = funcParts[1];
        const params = funcParts[2] ? 
            funcParts[2].split(',').map(p => p.trim().replace(/\s*\)$/, '')) : 
            [];
        
        // Find function body
        const functionBody = [];
        let endIndex = startIndex + 1;
        
        while (endIndex < lines.length && !lines[endIndex].startsWith('end')) {
            functionBody.push(lines[endIndex]);
            endIndex++;
        }
        
        // Store function
        this.functions[funcName] = {
            params,
            body: functionBody
        };
        
        return endIndex;
    }
    
    parseConditional(line, lines, lineIndex, context) {
        const conditionMatch = line.match(/if (.*) then/);
        if (!conditionMatch) {
            throw new Error(`Invalid conditional statement: ${line}`);
        }
        
        const condition = this.evaluateExpression(conditionMatch[1], context);
        
        // Find the else part and end
        const elseIndex = lines.findIndex((l, i) => 
            i > lineIndex && l.trim().startsWith('else')
        );
        const endIndex = lines.findIndex((l, i) => 
            i > lineIndex && l.trim() === 'end'
        );
        
        if (condition) {
            // Execute the 'then' block
            const thenBlock = lines.slice(lineIndex + 1, elseIndex !== -1 ? elseIndex : endIndex);
            this.parseLines(thenBlock, context);
        } else if (elseIndex !== -1) {
            // Execute the 'else' block
            const elseBlock = lines.slice(elseIndex + 1, endIndex);
            this.parseLines(elseBlock, context);
        }
    }
    
    parsePrint(line, context) {
        const expression = line.replace('print', '').trim();
        const value = this.evaluateExpression(expression, context);
        this.print(value);
    }
    
    evaluateExpression(expr, context = null) {
        context = context || this.variables;
        
        // Trim whitespace
        expr = expr.trim();
        
        // Handle string literals
        if (expr.startsWith('"') && expr.endsWith('"')) {
            return expr.slice(1, -1);
        }
        
        // Handle list literals
        if (expr.startsWith('[') && expr.endsWith(']')) {
            const items = expr.slice(1, -1).split(',')
                .map(item => this.evaluateExpression(item.trim(), context));
            return items;
        }
        
        // Handle numeric literals
        if (!isNaN(expr)) {
            return Number(expr);
        }
        
        // Handle variables
        if (context[expr] !== undefined) {
            return context[expr];
        }
        
        // Improved function call parsing
        const funcCallMatch = expr.match(/(\w+)\s*\(([^)]*)\)/);
        if (funcCallMatch) {
            const funcName = funcCallMatch[1];
            const argsStr = funcCallMatch[2];
            return this.executeFunctionCall(funcName, argsStr, context);
        }
        
        // Handle mathematical and comparison operations
        try {
            return this.evaluateMathExpression(expr, context);
        } catch (error) {
            throw new Error(`Cannot evaluate expression: ${expr}`);
        }
    }
    
    executeFunctionCall(funcName, argsStr, context) {
        const func = this.functions[funcName];
        if (!func) throw new Error(`Function ${funcName} not defined`);
        
        // Improved argument parsing to handle various argument formats
        const args = argsStr ? 
            argsStr.split(',').map(arg => this.evaluateExpression(arg.trim(), context)) : 
            [];
        
        // Validate argument count
        if (args.length !== func.params.length) {
            throw new Error(`Function ${funcName} expects ${func.params.length} arguments, got ${args.length}`);
        }
        
        // Create local scope
        const localVariables = {...context};
        func.params.forEach((param, i) => {
            localVariables[param] = args[i];
        });
        
        // Temporarily replace global variables
        const oldVariables = {...this.variables};
        this.variables = localVariables;
        
        // Execute function body
        let returnValue;
        for (const line of func.body) {
            if (line.startsWith('return')) {
                returnValue = this.evaluateExpression(line.replace('return', '').trim(), localVariables);
                break;
            }
            this.parseLine(line, func.body, 0, localVariables);
        }
        
        // Restore global variables
        this.variables = oldVariables;
        
        return returnValue;
    }
    
    evaluateMathExpression(expr, context) {
        // Replace variable names with their values for evaluation
        const safeExpr = expr.replace(/(\w+)/g, (match) => 
            context[match] !== undefined ? context[match] : match
        );
        
        // Use a safer way to evaluate expressions
        try {
            return new Function(`return ${safeExpr}`)();
        } catch (error) {
            throw new Error(`Invalid mathematical expression: ${expr}`);
        }
    }
    
    print(message) {
        this.outputArea.textContent += String(message) + '\n';
    }
}

// Initialize the interpreter
document.addEventListener('DOMContentLoaded', () => {
    new SymbolScriptInterpreter();
});