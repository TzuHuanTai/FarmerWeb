export class Action {
    //有bug，宣告矩陣塞資料後，屬性第一字母會自動變小寫menuText這樣！html打MenuText反而找不到...
    public id: number;
    public name?: string;
    public method?: string;
    public controllerId?: number;
    public description?: string;    
}

export class Ctrl {
    //有bug，宣告矩陣塞資料後，屬性第一字母會自動變小寫menuText這樣！html打MenuText反而找不到...
    public id: number;
    public name?: string;
    public description?: string;

    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}