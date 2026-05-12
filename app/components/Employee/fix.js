const fs = require('fs');
const file = 'e:\\super-green erp\\app\\components\\Employee\\Model.tsx';
let content = fs.readFileSync(file, 'utf8');
const reps = {
    'bg-white': 'bg-card',
    'border-white/20': 'border-border',
    'text-slate-900': 'text-foreground',
    'text-slate-800': 'text-foreground',
    'text-gray-900': 'text-foreground',
    'text-gray-800': 'text-foreground',
    'text-gray-700': 'text-foreground',
    'text-gray-600': 'text-muted-foreground',
    'text-gray-500': 'text-muted-foreground',
    'text-gray-400': 'text-muted-foreground/50',
    'bg-gray-100': 'bg-muted/50',
    'hover:bg-gray-50': 'hover:bg-muted/80',
    'border-gray-200': 'border-border',
    'border-gray-300': 'border-border/80',
    'bg-gray-50': 'bg-muted/30',
    'bg-blue-600 text-white': 'bg-primary text-primary-foreground hover:opacity-90',
    'bg-blue-600': 'bg-primary',
    'text-blue-600': 'text-primary',
    'hover:text-blue-600': 'hover:text-primary',
    'hover:border-blue-400': 'hover:border-primary',
    'border-blue-600': 'border-primary',
    'shadow-blue-200': 'shadow-primary/20',
    'bg-blue-50/50': 'bg-primary/5',
    'border-blue-100': 'border-primary/20',
    'bg-emerald-600': 'bg-primary',
    'border-emerald-600': 'border-primary',
    'bg-emerald-50/50': 'bg-primary/5',
    'border-emerald-100': 'border-primary/20',
    'hover:bg-emerald-700': 'hover:bg-primary/80',
    'text-emerald-600': 'text-primary',
    'bg-gray-300': 'bg-muted'
};
for (let [k, v] of Object.entries(reps)) {
    content = content.split(k).join(v);
}
fs.writeFileSync(file, content, 'utf8');
