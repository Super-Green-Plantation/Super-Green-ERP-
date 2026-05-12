const fs = require('fs');
const path = require('path');

const dir = 'e:\\super-green erp\\app\\components\\Client';

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
                callback(filePath);
            }
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

const reps = {
    'bg-white': 'bg-card',
    'bg-slate-900/40': 'bg-background/80',
    'border-white/20': 'border-border',
    'border-white': 'border-card',
    'text-slate-900': 'text-foreground',
    'text-slate-800': 'text-foreground',
    'text-slate-700': 'text-foreground',
    'text-slate-600': 'text-muted-foreground',
    'text-slate-500': 'text-muted-foreground',
    'text-gray-900': 'text-foreground',
    'text-gray-800': 'text-foreground',
    'text-gray-700': 'text-foreground',
    'text-gray-600': 'text-muted-foreground',
    'text-gray-500': 'text-muted-foreground',
    'hover:bg-slate-50': 'hover:bg-muted/80',
    'hover:bg-gray-50': 'hover:bg-muted/80',
    'border-slate-200': 'border-border',
    'border-slate-100': 'border-border/50',
    'border-gray-200': 'border-border',
    'bg-slate-50': 'bg-muted/30',
    'bg-gray-50': 'bg-muted/30',
    'hover:text-slate-900': 'hover:text-foreground',
    'bg-slate-900 hover:bg-blue-600 disabled:bg-slate-400 text-white': 'bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground',
    'bg-slate-900 text-white': 'bg-primary text-primary-foreground hover:opacity-90',
    'bg-blue-600 text-white': 'bg-primary text-primary-foreground hover:opacity-90',
    'shadow-xl shadow-slate-200': 'shadow-none',
    'bg-blue-50': 'bg-primary/10',
    'text-blue-600': 'text-primary',
    'text-blue-500': 'text-primary',
    'group-hover:text-blue-600': 'group-hover:text-primary',
    'group-hover:border-blue-400': 'group-hover:border-primary',
    'border-blue-500/20': 'border-primary/20',
    'bg-blue-500/10': 'bg-primary/10',
    'bg-blue-500/20': 'bg-primary/20',
    'bg-blue-500/5': 'bg-primary/5',
    'bg-blue-500': 'bg-primary',
    'text-blue-400': 'text-primary',
    'bg-red-50': 'bg-red-500/10',
    'text-red-500': 'text-red-500',
    'hover:bg-red-500': 'hover:bg-red-500/20',
    'hover:text-white': 'hover:text-foreground',
    'border-red-200': 'border-red-500/20',
    'bg-orange-50': 'bg-orange-500/10',
    'border-orange-100': 'border-orange-500/20',
    'bg-orange-500 text-white': 'bg-orange-500/20 text-orange-500',
    'text-orange-700': 'text-orange-500',
    'shadow-2xl': 'shadow-lg',
    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': 'bg-primary/10 text-primary border-primary/20',
    'bg-slate-800 text-muted-foreground border-slate-700': 'bg-muted text-muted-foreground border-border',
    'bg-emerald-50 text-emerald-600': 'bg-primary/10 text-primary',
    'border-emerald-200': 'border-primary/20'
};

walkSync(dir, function (filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (let [k, v] of Object.entries(reps)) {
        content = content.split(k).join(v);
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
});
