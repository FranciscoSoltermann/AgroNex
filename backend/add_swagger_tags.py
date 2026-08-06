import os
import re

directory = r"C:\Users\fraso\Documents\Proyectos\AgroNex\backend\src\main\java\org\agronex\backend\controller"

for filename in os.listdir(directory):
    if filename.endswith("Controller.java"):
        filepath = os.path.join(directory, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        if "import io.swagger.v3.oas.annotations.tags.Tag;" not in content:
            content = re.sub(r'(import .*;\n)(?!import)', r'\1import io.swagger.v3.oas.annotations.tags.Tag;\n', content, 1)

        if "@Tag(" not in content:
            name = filename.replace("Controller.java", "")
            display_name = re.sub(r'(?<!^)(?=[A-Z])', ' ', name)
            
            tag_annotation = f'@Tag(name = "{display_name}", description = "Operaciones de {display_name}")\n'
            
            content = re.sub(r'(public class ' + filename.replace(".java", "") + ')', tag_annotation + r'\1', content, 1)
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Added @Tag to {filename}")
        else:
            print(f"Already has @Tag: {filename}")
