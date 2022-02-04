var website_url = "https://woodrush.github.io/adv-pokemon-wordle/";
var currow = 0;
var curcol = 0;
var str = "";
var curkeyboard = 0;
var current_pokedex = [];

var feedback_history = [];
var screen_state = "game";

var FEEDBACK_CLEARED = "GGGGG";
var game_finished = false;

var modedict = {
    "hard": false,
    "ultrahard": false,
}

var ultrahard_goal = "";

function toggleKeyboard() {
    const keyboard_0 = document.getElementById("keyboard-0");
    const keyboard_1 = document.getElementById("keyboard-1");
    if (curkeyboard == 0) {
        keyboard_0.style.display = "none";
        keyboard_1.style.display = "block";
        curkeyboard = 1;
    } else {
        keyboard_0.style.display = "block";
        keyboard_1.style.display = "none";
        curkeyboard = 0;
    }
}

function onClickKey(key_dom) {
    const keychar = key_dom.getAttribute("key");
    console.log(keychar);
    typekey(keychar);
}

function update_box_row_text(s) {
    for(let i=0; i<5; i++){
        const box = document.getElementById("box-" + currow + "-" + i);
        if (s[i]) {
            box.innerHTML = "<b class='box-text-input' id='box-text-" + currow + "-" + i + "'>" + s[i] + "</b>";
        } else {
            box.innerHTML = "";
        }
    }
    curcol = s.length;
}

function if_enter(str) {
    str = str.replace(/\s+/g, "");
    if (is_pokemon(str)) {
        if (modedict["hard"] && !current_pokedex.includes(str)) {
            window.alert("ハードモード：" + str + "は現在のヒントに合致しません。");
            return true;
        }
        update_box_row_text(str);

        let feedback = get_optimal_feedback_and_set_pokedex(str, current_pokedex);
        let feedback_keystate = feedback2keystate(str, feedback);
        console.log(current_pokedex.length);
        console.log(feedback);
        console.log(feedback_keystate);
        update_box_row_color(feedback);
        feedback_history.push(feedback);

        update_keyboard_color(feedback_keystate);

        if (modedict["ultrahard"] && !current_pokedex.includes(ultrahard_goal)) {
            game_finished = true;
            document.getElementById("ultrahard-fail-container").style.display = "block";
            return true;
        }

        if (feedback == FEEDBACK_CLEARED) {
            game_finished = true;
            show_results();
        } else {
            add_box_row();
        }
        return true;
    } else {
        window.alert(str + "は有効なポケモンの名前ではありません。");
        return false;
    }
}

function typekey(key) {
    if (game_finished) {
        return;
    }
    if (key == "bs") {
        if (curcol > 0) {
            str = str.slice(0,curcol-1);
            curcol -= 1;
        }
    } else if (key == "enter") {
        let input_text = document.getElementById("input_text");
        if (input_text.value != "") {
            if_enter(input_text.value);
        } else {
            if_enter(str);
        }
        return;
    } else if (curcol > 4) {
        return;
    } else {
        str = str + key;
        curcol += 1;
    }
    update_box_row_text(str);
}

function update_box_row_color(feedback) {
    for(let i=0; i<feedback.length; i++){
        const color = feedback[i];
        const box = document.getElementById("box-" + currow + "-" + i);
        box.classList.remove("box-empty");
        box.classList.add("box-" + color);
        const box_text = document.getElementById("box-text-" + currow + "-" + i);
        if (box_text) {
            box_text.classList.remove("box-text-input");
            box_text.classList.add("box-text-output");
        }
    }
}

function add_box_row() {
    let board = document.getElementById("board");
    let tr = document.createElement("tr");
    currow += 1;
    curcol = 0;
    str = "";
    for(let i=0; i<5; i++){
        let td = document.createElement("td");
        td.setAttribute("id", "box-" + currow + "-" + i);
        td.setAttribute("class", "box-base box-empty");
        tr.appendChild(td);
    }
    board.appendChild(tr);
}

function update_keyboard_color(feedback_keystate) {
    console.log(feedback_keystate);
    for (const [k, v] of Object.entries(feedback_keystate)) {
        let key = document.querySelectorAll('[key="'+k+'"]')[0];
        console.log(key);
        if (key.classList.contains("key-Y")) {
            key.classList.remove("key-Y");
        }

        if (!key.classList.contains("key-G")) {
            key.classList.add("key-" + v);
        }
    }
}

function is_pokemon(name) {
    let str_5 = (name + "     ").slice(0,5);
    return pokedex.includes(str_5);
}

function get_feedback(testword, hiddenword) {
    cset_hidden = {};
    for (let i=0; i<hiddenword.length; i++) {
        const c = hiddenword[i];
        if (!cset_hidden[c]) {
            cset_hidden[c] = 0;
        }
        cset_hidden[c] += 1;
    }

    for (let i=0; i<testword.length; i++) {
        if (testword[i] == hiddenword[i]) {
            cset_hidden[testword[i]] -= 1;
        }
    }
    ret = "";
    for (let i=0; i<testword.length; i++) {
        let c_test = testword[i];
        let c_hidden = hiddenword[i];
        if (c_test == c_hidden) {
            ret = ret + "G";
        } else if (hiddenword.includes(c_test)) {
            if (cset_hidden[c_test] && cset_hidden[c_test] > 0) {
                ret = ret + "Y";
                cset_hidden[c_test] -= 1;
            } else {
                ret = ret + "B";
            }
        } else {
            ret = ret + "B";
        }
    }
    return ret;
}

function feedback2keystate(testword, feedback) {
    ret_keystate = {};
    for (let i=0; i<feedback.length; i++) {
        if (feedback[i] == "G") {
            ret_keystate[testword[i]] = "G";
        } else if (feedback[i] == "Y") {
            if (!ret_keystate[testword[i]]) {
                ret_keystate[testword[i]] = "Y";
            }
        } else if (feedback[i] == "B") {
            ret_keystate[testword[i]] = "B";
        }
    }
    return ret_keystate;
}

function get_optimal_feedback_and_set_pokedex(testword, H) {
    let feedback_dict = {};
    H.forEach(hiddenword => {
        let feedback = get_feedback(testword, hiddenword);
        if (!feedback_dict[feedback]) {
            feedback_dict[feedback] = [];
        }
        feedback_dict[feedback].push(hiddenword);
    });

    let maxlength = -1;
    let maxfeedback;
    let maxset;
    for (const [feedback, hset] of Object.entries(feedback_dict)) {
        if (hset.length > maxlength || (hset.length == maxlength && feedback != FEEDBACK_CLEARED)) {
            maxlength = hset.length;
            maxfeedback = feedback;
            maxset = hset;
        }
    }
    current_pokedex = maxset;
    console.log(current_pokedex);
    return maxfeedback;
}

function init() {
    current_pokedex = [];
    for (let i=0; i<pokedex.length; i++) {
        const pokemon = pokedex[i];
        if (!pokemon.includes(" ")) {
            current_pokedex.push(pokemon);
        }
    }

    let input_text = document.getElementById("input_text");
    // input_text.addEventListener("keypress", textbox_onkey);
    input_text.addEventListener("keydown", textbox_onkey);

    if (!cookie_check_nomessage()) {
        window.setTimeout(clickHelp, 800);
    }

    document.getElementById("settings-key").addEventListener("click", clickSettings);
    document.getElementById("help-key").addEventListener("click", clickHelp);
    document.getElementById("result-failed").addEventListener("click", function () {
        tweet_result("failed");
    });
    document.getElementById("result-cleared").addEventListener("click", function () {
        tweet_result("cleared");
    });
    document.getElementById("start-game-button").addEventListener("click", clickHelp);
    document.getElementById("result-button").addEventListener("click", share_twitter);
    document.getElementById("set-nomessage-cookie-button").addEventListener("click", set_nomessage_cookie);

    document.getElementById("settings-link-1").addEventListener("click", clickSettings);
    document.getElementById("help-to-settings-1").addEventListener("click", clickSettings);

    document.getElementById("check-hard").addEventListener("click", function () {
        click_mode("hard");
    });
    document.getElementById("check-ultrahard").addEventListener("click", function () {
        click_mode("ultrahard");
    });

    document.getElementById("set-nomessage-cookie-button-2").addEventListener("click", set_nomessage_cookie);
    document.getElementById("delete-cookie-button").addEventListener("click", delete_cookie);

    document.getElementById("settings-to-game-button").addEventListener("click", clickSettings);
    document.getElementById("toggle-key").addEventListener("click", toggleKeyboard);
}

function clickHelp() {
    const cur_container = document.getElementById(screen_state + "-container");
    const game_container = document.getElementById("game-container");
    const help_container = document.getElementById("help-container");
    if (screen_state == "help") {
        game_container.style.display = "block";
        help_container.style.display = "none";
        screen_state = "game";
    } else {
        cur_container.style.display = "none";
        help_container.style.display = "block";
        screen_state = "help";
    }
}

function clickSettings() {
    const cur_container = document.getElementById(screen_state + "-container");
    const game_container = document.getElementById("game-container");
    const settings_container = document.getElementById("settings-container");
    if (screen_state == "settings") {
        game_container.style.display = "block";
        settings_container.style.display = "none";
        screen_state = "game";
    } else {
        cur_container.style.display = "none";
        settings_container.style.display = "block";
        screen_state = "settings";
    }
}

function show_results() {
    document.getElementById("result-container").style.display = "block";
    document.getElementById("result-turns").innerHTML = currow + 1;
    if (modedict["ultrahard"]) {
        document.getElementById("result-ultrahard-message").style.display = "block";
    }
}

function textbox_onkey(e) {
    if (game_finished) {
        return;
    }
    let input_text = document.getElementById("input_text");
    if (e.keyCode === 13) {
        // str = input_text.value;
        // update_box_row_text(str);
        let result = if_enter(input_text.value);
        if (result) {
            input_text.value = "";
        }
    }
    return false;
}

function tweet_result(result) {
    let ret_text = "後出しポケモンWordle";
    if (modedict["ultrahard"]) {
        ret_text = ret_text + "のウルトラハードモード";
    }
    if (result == "cleared") {
        ret_text = ret_text + "を" + (currow + 1) + "手でクリアしました。%0A"
    } else {
        ret_text = ret_text + "をクリアできませんでした…%0A"
    }
    const feedback2emoji = {
        "G": "🟩",
        "Y": "🟨",
        "B": "⬛"
    };
    for (const feedback of feedback_history){
        let ftext = "";
        for (const c of feedback) {
            ftext = ftext + feedback2emoji[c];
        }
        ret_text = ret_text + ftext + "%0A";
    }
    ret_text = ret_text + "%23後出しポケモンWordle%0A";
    ret_text = ret_text + website_url;

    window.open("https://twitter.com/intent/tweet?text=" + ret_text, "_blank");
}

function share_twitter(result) {
    let ret_text = "後出しポケモンWordle %23後出しポケモンWordle%0A";
    ret_text = ret_text + website_url;

    window.open("https://twitter.com/intent/tweet?text=" + ret_text, "_blank");
}

function click_mode(mode) {
    if (currow > 0) {
        window.alert("モード選択は1手目入力前に行って下さい。");
        let checkbox = document.getElementById("check-"+mode);
        checkbox.checked = !checkbox.checked;
        return;
    }
    let is_hard = document.getElementById("check-hard").checked;
    let is_ultrahard = document.getElementById("check-ultrahard").checked;
    modedict["hard"] = is_hard;
    modedict["ultrahard"] = is_ultrahard;

    let ultrahard_container = document.getElementById("ultrahard-container");
    ultrahard_container.style.display = modedict["ultrahard"] ? "block" : "none";

    if (modedict["ultrahard"]) {
        set_ultrahard_goal();
    }
}

function set_ultrahard_goal() {
    ultrahard_goal = current_pokedex[Math.floor(Math.random() * current_pokedex.length)];

    let goaldoms = document.querySelectorAll(".ultrahard-goal");
    goaldoms.forEach(element => {
        element.innerHTML = ultrahard_goal;
    });
}

function cookie_check_nomessage() {
    console.log(document.cookie);
    const cookies = document.cookie.split('; ');
    return cookies.includes("nomessage=true");
}

function delete_cookie() {
    document.cookie.split(";").forEach(item => {
        const eq_pos = item.indexOf("=");
        const key = eq_pos > -1 ? item.slice(0, eq_pos) : item;
        document.cookie = key + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    });
  }

function set_nomessage_cookie() {
    document.cookie = "nomessage=true;";
}
