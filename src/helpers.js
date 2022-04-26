import { ethers } from "ethers";
import AirbnbContract from "./abi/Airbnb.json";

const contractInterface = new ethers.utils.Interface(AirbnbContract.abi);

export function sortDatesWithHashes(dates) {
    dates = dates.map((a) => ({ v: a, k: ethers.BigNumber.from(ethers.utils.hashMessage(a)) }))
    dates = dates.sort((a, b) => a.k - b.k).map(a => a.v);
    return dates;
}

export function getError(identifier) {
    return contractInterface.getError(identifier);
}

export function getFunctionOptionForMoralis(functionName, params, msgValue) {
    const { address: contractAddress } = AirbnbContract;
    const abi = AirbnbContract.abi.filter(a => a.name === functionName);
    if (!abi[0]) return null;
    return { contractAddress, functionName, abi, params, msgValue };
}
