//- # handler.ts --- the handler generator, in the TEMPLATE form: the
//- # file below IS a Lambda handler, and the marked lines are the
//- # aontu that turns one into twelve. It renders the same thirteen
//- # units as gen.aon, which is the canonical form of this file.
//- @"./model.aon"
//-
//- # Each service carries its own name, so a rule can read it.
//- svc: $.services & pack($.services, { name:key() })
//-
//- %handler = emit(_, {
//-   match: name: string
//-   esc: sq
//-   replace: SERVICE: .name
//-   body: [
import { getSeneca } from '../../env/lambda/lambda'

function complete(seneca: any) {
//-     emit(.listen, {
//-       match: pin: string
//-       esc: sq
//-       replace: PIN: .pin
//-       body: [
  seneca.listen({type:'sqs',pin:'PIN'})
//-       ]
//-     })
//-     emit(.client, {
//-       match: pin: string
//-       esc: sq
//-       replace: PIN: .pin
//-       body: [
  seneca.client({type:'sqs',pin:'PIN'})
//-       ]
//-     })
//-     emit(filter(.on.file.events, { source:s3 }), {
//-       match: { source:s3 msg:string }
//-       esc: sq
//-       replace: MSG: .msg
//-       body: [

  const makeGatewayHandler = seneca.export('s3-store/makeGatewayHandler')
  seneca
    .act('sys:gateway,kind:lambda,add:hook,hook:handler', {
       handler: makeGatewayHandler('MSG') })
//-       ]
//-     })
}

exports.handler = async (
  event:any,
  context:any
) => {
  
  let seneca = await getSeneca('SERVICE', complete)
  
  let handler = seneca.export('gateway-lambda/handler')
  let res = await handler(event, context)
  return res
}
//-   ]
//- })
//-
//- # One unit per service, and an index that names them all in the
//- # model's order. The unit list is one dispatch over two parts, the
//- # service map and the index marker, tried in sorted-key order.
//- parts: { handlers:$.svc index:true }
//-
//- code: units: emit($.parts, [
//-   {
//-     match: map()
//-     body: [
//-       emit(_, {
//-         match: name: string
//-         body: [
//-           {
//-             path: "handlers/" + .name + ".ts"
//-             lang: "typescript"
//-             decls: [{ k:"frag" of:emit([_], %handler) }]
//-           }
//-         ]
//-       })
//-     ]
//-   }
//-   {
//-     match: true
//-     body: [
//-       {
//-         path: "index.ts"
//-         lang: "typescript"
//-         decls: [
//-           {
//-             k: "frag"
//-             of: each(pick($.svc, name), "export const " + join(each(split(_, "-"), upper(_)), "_") + " = '" + _ + "'")
//-           }
//-         ]
//-       }
//-     ]
//-   }
//- ])
