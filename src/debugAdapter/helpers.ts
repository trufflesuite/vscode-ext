// from "D:/test/test1.sol" -> "d:\test\test1.sol"
export function toWindowsPath(filePath: string): string {
    const res = filePath.replace(/\//g, '\\');
    return res[0].toLowerCase() + res.substr(1);
}

export function groupBy(array: any[], key: any) {
    const a = array.reduce((rv, x) => {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
    return a;
}
