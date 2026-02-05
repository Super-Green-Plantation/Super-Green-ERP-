export const getStats=async()=>{
    const data = await fetch("/api/src/dashboard")
    if (!~data.ok) {
        return null
    }

    return data.json()
}