const htmlEl = document.documentElement;

class AnimeGrid {
    constructor({el,title,key,typeTexts,col,row,urlExt = ''}){
        this.el = el;

        this.key = key;
        const types = typeTexts.trim().split(/\n+/g)
        this.types = types;
        this.bangumis = [];
        this.urlExt = urlExt;

        this.title = title;

        this.row = row;
        this.col = col;

        this.getBangumisFormLocalStorage();


        el.innerHTML = this.generatorHTML({
            title,
            urlExt,
        });

        this.currentBangumiIndex = null;
        this.searchBoxEl = el.querySelector('.search-bangumis-box');
        this.formEl = el.querySelector('form');
        this.searchInputEl = this.formEl[0];

        this.formEl.onsubmit = async e=>{
            if(e) e.preventDefault();

            this.setInputText();
        }

        const canvas = el.querySelector('canvas');
        const ctx = canvas.getContext('2d');

        this.canvas = canvas;
        this.ctx = ctx;

        const bodyMargin = 20;



        const contentWidth = col * 200;
        const contentHeight = row * 110;

        const colWidth = Math.ceil(contentWidth / col);
        const rowHeight = Math.ceil(contentHeight / row);
        const titleHeight = 40;
        const fontHeight = 24;

        this.fontHeight = fontHeight;

        const width = contentWidth + bodyMargin * 2;
        const height = contentHeight + bodyMargin * 2 + titleHeight;
        const scale = 2;


        canvas.width = width * scale;
        canvas.height = height * scale;

        ctx.fillStyle = '#FFF';
        ctx.fillRect(
            0,0, 
            width * scale,height * scale
        );

        const copyRightText = [
            urlExt,
            '修改自github.com/itorr/anime-grid@卜卜口',
            '禁止商业、盈利用途'
        ].join(' · ');


        ctx.textAlign = 'left';
        ctx.font = `${9 * scale}px sans-serif`;
        ctx.fillStyle = '#AAA';
        ctx.textBaseline = 'middle';
        ctx.lineCap  = 'round';
        ctx.lineJoin = 'round';
        ctx.fillText(
            copyRightText,
            19 * scale,
            (height - 10) * scale
        );

        ctx.scale(scale,scale);
        ctx.translate(
            bodyMargin,
            bodyMargin + titleHeight
        );

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#222';
        ctx.textAlign = 'center';


        ctx.save();


        ctx.font = 'bold 32px sans-serif';
        ctx.fillStyle = '#39c5bb';
        ctx.fillText(title,contentWidth / 2, -26 );




        ctx.lineWidth = 2;
        ctx.strokeStyle = '#222';

        for(let y = 0;y <= row;y++){

            ctx.beginPath();
            ctx.moveTo(0,y * rowHeight);
            ctx.lineTo(contentWidth,y * rowHeight);
            ctx.globalAlpha = 1;
            ctx.stroke();

            if( y === row) break;
            ctx.beginPath();
            ctx.moveTo(0,y * rowHeight + rowHeight - fontHeight);
            ctx.lineTo(contentWidth,y * rowHeight + rowHeight - fontHeight);
            ctx.globalAlpha = .2;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        for(let x = 0;x <= col;x++){
            ctx.beginPath();
            ctx.moveTo(x * colWidth,0);
            ctx.lineTo(x * colWidth,contentHeight);
            ctx.stroke();
        }
        ctx.restore();


        for(let y = 0;y < row;y++){

            for(let x = 0;x < col;x++){
                const top = y * rowHeight;
                const left = x * colWidth;
                const type = types[y * col + x];
                ctx.fillText(
                    type,
                    left + colWidth / 2,
                    top + rowHeight - fontHeight / 2,
                );
            }
        }


        const imageWidth = colWidth - 2;
        const imageHeight = rowHeight - fontHeight;
        const canvasRatio = imageWidth / imageHeight;


        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        this.colWidth = colWidth;
        this.rowHeight = rowHeight;
        this.canvasRatio = canvasRatio;
        
        ctx.font = 'bold 28px sans-serif';
        
        this.outputEl = el.querySelector('.output-box');
        this.outputImageEl = this.outputEl.querySelector('img');


        
        canvas.onclick = e=>{
            const rect = canvas.getBoundingClientRect();
            const { clientX, clientY } = e;
            const x = Math.floor(((clientX - rect.left) / rect.width * width - bodyMargin) / colWidth);
            const y = Math.floor(((clientY - rect.top) / rect.height * height  - bodyMargin - titleHeight) / rowHeight);
        
            if(x < 0) return;
            if(x >= col) return;
            if(y < 0) return;
            if(y > row) return;
        
            const index = y * col + x;
        
            if(index >= col * row) return;
        
            this.openSearchBox(index);
        }
        
        el.onclick = e=>{
            const { target } = e;
            const action = target.getAttribute('action');
            if(!action) return;
            
            const actionFunc = this[action];
            if(!actionFunc) return;

            actionFunc.call(this);
        }
        
        this.drawBangumis();

    }
    generatorHTML({title}){
        return `<canvas></canvas>
<div class="ctrl-box">
    <a class="generator-btn ui-btn go" action="downloadImage">生成${title}</a>
    <a class="generator-btn ui-btn danger" action="clearAll">全部清空</a>
</div>
<div class="search-bangumis-box ui-shadow" data-show="false">
    <div class="content-box">
        <form>
            <input type="textarea" placeholder="输入歌名、回车键确认填入">
        </form>
        <div class="foot">
            <a class="close ui-btn go" action="setInputText">确认填入</a>
            <a class="close ui-btn danger" action="setNull">重设为空</a>
            <a class="close ui-btn" action="closeSearchBox">取消</a>
        </div>
    </div>
</div>
<div class="output-box ui-shadow" data-show="false">
    <div class="content-box">
        <h3>生成好啦~</h3>
        <img>
        <div class="body">
            <p>长按图片进行保存</p>
        </div>
        <div class="foot">
            <a class="close ui-btn" action="closeOutput">关闭</a>
        </div>
    </div>
</div>`;
    }
    generatorDefaultBangumis(){
        this.bangumis = new Array(this.types.length).fill(null);
    }
    getBangumiIdsText(){
        return this.bangumis.map(i=>String( i || 0 )).join(',')
    }

    getBangumisFormLocalStorage(){
        
        if(!window.localStorage) return this.generatorDefaultBangumis();

        const bangumisText = localStorage.getItem(this.key);

        if(!bangumisText) return this.generatorDefaultBangumis();

        this.bangumis = bangumisText.split(/,/g);
    }
    saveBangumisToLocalStorage(){
        localStorage.setItem(this.key,this.getBangumiIdsText());
    }
    clearBangumisFromLocalStorage(){
        localStorage.removeItem(this.key);
    }
    clearAll(){
        this.clearBangumisFromLocalStorage();
        this.generatorDefaultBangumis();
        this.drawBangumis();
    }


    openSearchBox(index){
        this.currentBangumiIndex = index;
        htmlEl.setAttribute('data-no-scroll',true);
        this.searchBoxEl.setAttribute('data-show',true);
        
        this.searchInputEl.focus();

        const value = this.bangumis[index] || '';

        if(value && value!=='0'){
            this.searchInputEl.value = value;
        }
    }
    closeSearchBox(){
        htmlEl.setAttribute('data-no-scroll',false);
        this.searchBoxEl.setAttribute('data-show',false);
        this.searchInputEl.value = '';
    }
    
    setInputText(){
        const text = this.searchInputEl.value.trim().replace(/,/g,'&');
        this.setCurrentBangumi(text);
    }
    setNull(){
        this.setCurrentBangumi(null);
    }

    setCurrentBangumi(value){
        if(this.currentBangumiIndex === null) return;

        this.bangumis[this.currentBangumiIndex] = value;
        this.saveBangumisToLocalStorage();
        this.drawBangumis();

        this.closeSearchBox();
    }

    drawBangumis(){
        const { 
            col,row, 
            colWidth,rowHeight, 
            imageWidth,imageHeight,
            bangumis,
            canvasRatio,
            ctx,
        } = this;

        for(let index in bangumis){
            const id = bangumis[index];
            const x = index % col;
            const y = Math.floor(index / col);

            ctx.fillStyle = '#FFF';
            ctx.fillRect(
                x * colWidth + 1,
                y * rowHeight + 1, 
                imageWidth,
                imageHeight,
            )
            if(id && id !== '0'){
                ctx.fillStyle = '#39c5bb';
                ctx.fillText(
                    id,
                    (x + 0.5) * colWidth,
                    (y + 0.5) * rowHeight - 10, 
                    imageWidth - 10,
                );
            }
            
            ctx.fillStyle = '#d3d3d3';
            ctx.fillRect(
                x * colWidth + 1,
                y * rowHeight + imageHeight - 1, 
                imageWidth,
                2,
            )
        }
    }
    
    
    showOutput(imgURL){
        this.outputImageEl.src = imgURL;
        this.outputEl.setAttribute('data-show',true);
        htmlEl.setAttribute('data-no-scroll',true);
    }
    closeOutput(){
        this.outputEl.setAttribute('data-show',false);
        htmlEl.setAttribute('data-no-scroll',false);
    }
    
    downloadImage(){
        const fileName = `${this.title}.jpg`;
        const mime = 'image/jpeg';
        const imgURL = this.canvas.toDataURL(mime,0.8);
        const linkEl = document.createElement('a');
        linkEl.download = fileName;
        linkEl.href = imgURL;
        linkEl.dataset.downloadurl = [ mime, fileName, imgURL ].join(':');
        document.body.appendChild(linkEl);
        linkEl.click();
        document.body.removeChild(linkEl);
    
       this.showOutput(imgURL);
    }

}
