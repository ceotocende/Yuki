import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

 export function compileProject(projectPath: string = './'): boolean {
    // 1. Найти tsconfig.json
    const configPath = ts.findConfigFile(projectPath, ts.sys.fileExists);
    
    if (!configPath) {
        console.error('❌ tsconfig.json не найден');
        return false;
    }
    
    // 2. Прочитать и распарсить конфигурацию
    const configFile = ts.readConfigFile(configPath, (path) => fs.readFileSync(path, 'utf8'));
    const config = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath)
    );
    
    // 3. Создать программу для всего проекта
    const program = ts.createProgram(config.fileNames, config.options);
    
    // 4. Выполнить компиляцию
    const emitResult = program.emit();
    
    // 5. Собрать и вывести ошибки
    const allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);
    
    let hasErrors = false;
    
    allDiagnostics.forEach(diagnostic => {
        if (diagnostic.category === ts.DiagnosticCategory.Error) {
            hasErrors = true;
        }
        
        if (diagnostic.file) {
            const { line, character } = ts.getLineAndCharacterOfPosition(
                diagnostic.file, 
                diagnostic.start!
            );
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            console.log(
                `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
            );
        } else {
            console.log(
                ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
            );
        }
    });
    
    if (hasErrors) {
        console.log('❌ Компиляция завершилась с ошибками');
        return false;
    }
    
    console.log(`✅ Успешно скомпилировано ${config.fileNames.length} файлов в ${config.options.outDir || './'}`);
    return true;
}
