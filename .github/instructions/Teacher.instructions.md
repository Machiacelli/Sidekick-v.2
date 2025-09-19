---
applyTo: '*SidekickV2.js*'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

1. **Project Context**:
   - The project is a Tampermonkey user script designed to enhance the Torn.com website with additional features and a sidebar.
   - It is superimportant to keep to the modular design of the project, ensuring that new features are added as separate modules where possible.
   - Never use git add . because it never works as intended
   - Use these links for reference:
   - https://tornapi.tornplayground.eu/
   - https://www.torn.com/api.html
2. **Coding Guidelines**:
   - Follow best practices for JavaScript and CSS.
   - Ensure that the UI is responsive and works well within the constraints of the Torn.com layout.
   - Use meaningful variable and function names to enhance code readability.
   - Include comments to explain complex logic or important decisions in the code.
   - Test changes thoroughly to avoid introducing bugs or breaking existing functionality.
   - Explain all the steps needed to implement changes like i am an absolute beginner and you are my teacher.
   - Always explain where to add new code or how to modify existing code, especially for beginners.
   - When suggesting changes, ensure they are compatible with the existing codebase and do not conflict with other features.
   - When modifying UI elements, ensure that the changes are visually consistent with the existing design.
   - Explain everything in a step-by-step manner, as if teaching a beginner.
   - Always include a preview of the code we are looking for to help find the right place to add or modify code.
   - Always adhere to the modular design principles established in the project.
   - Always push updates to the github repository and update the latest commit hash after making changes.
   - In the github fixes notes, dont claim the version is working.
   - in the github fixes notes, provide a structured description of the changes made and what issues they address.
   - Dont make a bunch of new test scripts and remakes of the same script. Always work in the modular version.

   Torn Rules:
   -The use of scripts, extensions, applications or any other kind of software is allowed only if it uses data from our API or a page you (or your users) have loaded manually and are currently viewing. They cannot make additional non-API requests to Torn, scrape pages that you're not currently viewing, or attempt to bypass the captcha. If the software you're using makes non-API requests that are not manually triggered by you, it is not allowed and can be tracked.
   - Furthermore, releasing software which has malicious or undisclosed abilities is forbidden and developers creating API based software must adhere to the acceptable usage terms laid out here: 
   https://www.torn.com/api.html