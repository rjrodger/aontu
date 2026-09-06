import { getSeneca } from '../../env/lambda/lambda'

function complete(seneca: any) {
  seneca.listen({type:'sqs',pin:'sys:parse,cmd:run'})
  seneca.client({type:'sqs',pin:'sys:store'})
  seneca.client({type:'sqs',pin:'sys:embed'})
}

exports.handler = async (
  event:any,
  context:any
) => {
  
  let seneca = await getSeneca('parse', complete)
  
  let handler = seneca.export('gateway-lambda/handler')
  let res = await handler(event, context)
  return res
}
