declare module 'abi-decoder' {

    interface Decoded {
        name: string,
        params: any[];
    }

    function addABI(abi: []): void;
    function decodeMethod(input: string): Decoded;
    
    export { addABI, decodeMethod }; 
}