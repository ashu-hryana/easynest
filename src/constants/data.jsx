// src/constants/data.js

// MUI icons import karo
import { 
    TvOutlined, AcUnitOutlined, KitchenOutlined, PowerOutlined, 
    BathtubOutlined, WaterOutlined, BalconyOutlined, BedOutlined, 
    WifiOutlined, VpnKeyOutlined, VideocamOutlined, DirectionsCarOutlined,
    MusicNoteOutlined, SmokeFreeOutlined, NoDrinksOutlined, 
    PeopleOutline, SupervisedUserCircleOutlined
} from '@mui/icons-material';

// export karo taaki poori app mein use kar sakein
export const AVAILABLE_AMENITIES = [
    { icon: <TvOutlined />, label: 'LED TV' },
    { icon: <AcUnitOutlined />, label: 'AC' },
    { icon: <KitchenOutlined />, label: 'Fridge' },
    { icon: <PowerOutlined />, label: '24/7 Electricity Backup' },
    { icon: <BathtubOutlined />, label: 'Geyser' },
    { icon: <WaterOutlined />, label: 'RO Water' },
    { icon: <KitchenOutlined />, label: 'Attached Kitchen' },
    { icon: <BalconyOutlined />, label: 'Balcony' },
    { icon: <BedOutlined />, label: 'Mattress Included' },
    { icon: <WifiOutlined />, label: 'WiFi' },
    { icon: <VpnKeyOutlined />, label: 'Room Lock' },
    { icon: <VideocamOutlined />, label: 'CCTV' },
    { icon: <DirectionsCarOutlined />, label: 'Parking' },
];

export const AVAILABLE_RULES = [
    { icon: <MusicNoteOutlined />, label: 'No Loud Noises Late Night' },
    { icon: <SmokeFreeOutlined />, label: 'No Smoking Allowed' },
    { icon: <NoDrinksOutlined />, label: 'No Alcohol Allowed' },
    { icon: <PeopleOutline />, label: 'No Guests Allowed' },
    { icon: <SupervisedUserCircleOutlined />, label: 'Guests Allowed on Weekends' },
];