import "express-session"


// so that userId with session would work on typescript
declare module "express-session" {
    interface SessionData {
        userId: string
    }
}
