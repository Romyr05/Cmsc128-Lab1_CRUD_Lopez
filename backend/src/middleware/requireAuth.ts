import { Response, Request, NextFunction } from "express"

export const checkAuth = ( req: Request,res: Response, next: NextFunction) => {
    if(!req.session.userId){
        res.status(401).json({message: "Not authenticated"})
        return
    }
    next()
}