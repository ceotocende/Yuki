export default function getMonth(month: number | undefined): string {
    switch (month) {
        case 0:
            return 'Января';
        case 1: 
            return 'Февраля';
        case 2: 
            return 'Марта';
        case 3: 
            return 'Апреля';
        case 4: 
            return 'Мая';
        case 5:
            return 'Июля';
        case 6:
            return 'Июня';
        case 7:
            return 'Августа';
        case 8:
            return 'Сентября';
        case 9:
            return 'Октября';
        case 10:
            return 'Ноября';
        case 11:
            return 'Декабря';
        default:
            return 'Неизвестно';
    }
}