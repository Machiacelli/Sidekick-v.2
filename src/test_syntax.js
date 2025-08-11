// Simple syntax test
try {
    // Load the userscript content
    const fs = require('fs');
    const content = fs.readFileSync('sidewinder-modular.user.js', 'utf8');
    
    // Basic syntax validation (not execution)
    console.log('✅ File loaded successfully');
    console.log(`📊 File size: ${content.length} characters`);
    console.log(`📏 Lines: ${content.split('\n').length}`);
    
    // Check for common syntax issues
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    console.log(`🔍 Braces check: ${openBraces} open, ${closeBraces} close`);
    
    if (openBraces === closeBraces) {
        console.log('✅ Braces are balanced');
    } else {
        console.log('❌ Braces are not balanced');
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
}
