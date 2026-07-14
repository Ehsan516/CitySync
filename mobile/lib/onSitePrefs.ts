import AsyncStorage from "@react-native-async-storage/async-storage";

const onSiteKey = "citysync.onSiteToday.v1";//stores date and boolean to reset each day

function todayYmd() : string{//helper for todays date
    const d = new Date();

    const mm =  String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    //month and day padded 2 digits

    return `${d.getFullYear()}-${mm}-${dd}`;

}

export async function getOnSiteToday(): Promise<boolean>{
//whether onsite toggled on for today
    try{
        const raw = await AsyncStorage.getItem(onSiteKey);
        if(!raw) return false;
        //raw json read from storage, if nothing then default false

        const parsed = JSON.parse(raw) as {date:string; onSite: boolean};
        //parse stored value

        if (parsed.date !== todayYmd()) return false;//if stored date not today then resets
        return parsed.onSite;}
        catch{
            return false;//if read fails then false
        }
    }

export async function setOnSiteToday(onSite: boolean): Promise<void>{
//sets onsite mode
    await AsyncStorage.setItem(onSiteKey, JSON.stringify({ date: todayYmd(), onSite}));
    //^stores todays date and flag and auto resets every day
}


